/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../api/axios";

import { auth, db } from "../firebase";
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getAuthCreds } from "../api/axios";

import type { Message } from "../types/chat";

/** Un chat en nuestra UI y en Firestore */
export interface Conversation {
  id: string;      // coincide con el docId en Firestore
  chatId: string;  // id que devuelve el backend
  title: string;
  messages: Message[];
}

/** Estado completo de la aplicación de chat */
type ChatState = {
  conversations: Conversation[];
  currentId: string | null;
  selectedFiles: string[];
  loading: boolean;

  newChat(): Promise<void>;
  selectChat(id: string): void;
  sendMessage(text: string): Promise<void>;
  deleteChat(id: string): Promise<void>;
  toggleFile(id: string): void;
};

/** Generador de UUID para mensajes */
// const uuid = () => crypto.randomUUID();

/** Creamos el slice con persistencia reducida */
export const useChatSlice = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentId: null,
      selectedFiles: [],
      loading: false,

      /** 1) Crear un chat nuevo en backend + Firestore */
      async newChat() {
        const { data } = await api.post("/chat/start"); // { chatId }
        const user = auth.currentUser as User | null;
        if (!user) return;

        // 1.1) Firestore: añade doc en /users/{uid}/chats
        const ref = await addDoc(
          collection(db, "users", user.uid, "chats"),
          {
            chatId: data.chatId,
            title: "Nuevo chat",
            messages: [],
            updatedAt: serverTimestamp(),
          }
        );

        // 1.2) UI local
        set((s) => ({
          conversations: [
            ...s.conversations,
            {
              id: ref.id,
              chatId: data.chatId,
              title: "Nuevo chat",
              messages: [],
            },
          ],
          currentId: ref.id,
        }));
      },

      /** 2) Cambiar de conversación */
      selectChat(id: string) {
        set({ currentId: id });
      },

      /** 3) Enviar mensaje al backend (SSE o JSON) y guardar en Firestore */
      /* dentro de useChatSlice -> sendMessage */
      async sendMessage(text: string) {
        // 0️⃣ Asegura conversación
        if (!get().currentId) await get().newChat();
        const { currentId, conversations } = get();
        if (!currentId) return;

        const idx = conversations.findIndex((c) => c.id === currentId);
        if (idx === -1) return;
        const conv = conversations[idx];

        // 1️⃣ Optimistic UI
        const userMsg: Message = {
          id: crypto.randomUUID(),
          role: "user",
          content: text,
          timestamp: Date.now(),
        };
        const botPlaceholderId = crypto.randomUUID();
        const botMsg: Message = {
          id: botPlaceholderId,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        };

        set((s) => {
          const list = [...s.conversations];
          list[idx] = {
            ...conv,
            title: conv.messages.length ? conv.title : text,
            messages: [...conv.messages, userMsg, botMsg],
          };
          return { conversations: list, loading: true };
        });

        // 2️⃣ Prepara fetch
        const body = {
          chatId: conv.chatId,
          message: text,
          selectedIds: get().selectedFiles,
          stream: true,
        };
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Accept: "text/event-stream,application/json",
        };
        const { basicUser, basicPass } = getAuthCreds();
        if (basicUser && basicPass) {
          headers.Authorization = "Basic " + btoa(`${basicUser}:${basicPass}`);
        }

        try {
          const resp = await fetch(`${api.defaults.baseURL}/chat`, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

          const ctype = resp.headers.get("content-type") || "";

          // 3A) STREAMING SSE → solo UI
          if (ctype.startsWith("text/event-stream")) {
            const reader = resp.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });

              const parts = buffer.split("\n\n");
              buffer = parts.pop()!; // último trozo incompleto

              for (const chunk of parts) {
                if (!chunk.startsWith("data:")) continue;
                const delta = chunk.slice(5);
                // actualiza solo UI
                set((s) => {
                  const convs = [...s.conversations];
                  const c = convs[idx];
                  convs[idx] = {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === botPlaceholderId
                        ? { ...m, content: m.content + delta }
                        : m
                    ),
                  };
                  return { conversations: convs };
                });
              }
            }
          }
          // 3B) JSON normal → UI
          else if (ctype.includes("application/json")) {
            const json = await resp.json();
            const answer = json.answer ?? json.error ?? "[sin respuesta]";
            set((s) => {
              const convs = [...s.conversations];
              const c = convs[idx];
              convs[idx] = {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === botPlaceholderId ? { ...m, content: answer } : m
                ),
              };
              return { conversations: convs };
            });
          }
          // 3C) Texto plano
          else {
            const txt = await resp.text();
            const answer = txt.trim() || "[sin respuesta]";
            set((s) => {
              const convs = [...s.conversations];
              const c = convs[idx];
              convs[idx] = {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === botPlaceholderId ? { ...m, content: answer } : m
                ),
              };
              return { conversations: convs };
            });
          }

          // 4️⃣ Al final, guardamos TODO el array en Firestore
          const user = auth.currentUser as User | null;
          if (user) {
            const cid = currentId;
            const ref = doc(db, "users", user.uid, "chats", cid);
            await updateDoc(ref, {
              messages: get().conversations[idx].messages,
              title: get().conversations[idx].title,
              updatedAt: serverTimestamp(),
            }).catch(() => {});
          }
        } catch (err) {
          console.error("sendMessage error:", err);
          // En caso de fallo, muestra mensaje de error en UI
          set((s) => {
            const convs = [...s.conversations];
            const c = convs[idx];
            convs[idx] = {
              ...c,
              messages: c.messages.map((m) =>
                m.id === botPlaceholderId
                  ? {
                      ...m,
                      content:
                        "Lo siento, ocurrió un error al procesar tu solicitud.",
                    }
                  : m
              ),
            };
            return { conversations: convs };
          });
        } finally {
          set({ loading: false });
        }
      },


      /** 4) Borrar conversación: backend + Firestore + UI */
      async deleteChat(id: string) {
        // 4.1) Backend
        const conv = get().conversations.find((c) => c.id === id);
        if (conv) {
          try { await api.delete(`/chat/${conv.chatId}`); } catch {}
        }

        // 4.2) Firestore
        const user = auth.currentUser as User | null;
        if (user) {
          await deleteDoc(doc(db, "users", user.uid, "chats", id)).catch(
            () => void 0
          );
        }

        // 4.3) UI local
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          currentId: s.currentId === id ? null : s.currentId,
        }));
      },

      /** 5) Toggle archivos seleccionados */
      toggleFile(id: string) {
        set((s) => ({
          selectedFiles: s.selectedFiles.includes(id)
            ? s.selectedFiles.filter((x) => x !== id)
            : [...s.selectedFiles, id],
        }));
      },
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => localStorage),
      // Sólo UI mínima: el resto vive en Firestore
      partialize: (s) => ({
        currentId: s.currentId,
        selectedFiles: s.selectedFiles,
      }),
    }
  )
);

/** 6) Carga inicial desde Firestore al autenticarse */
onAuthStateChanged(auth, async (user: User | null) => {
  if (!user) {
    useChatSlice.setState({ conversations: [], currentId: null });
    return;
  }

  const snap = await getDocs(
    query(
      collection(db, "users", user.uid, "chats"),
      orderBy("updatedAt", "desc")
    )
  );

  const convs: Conversation[] = snap.docs.map((d) => ({
    id: d.id,
    chatId: d.data().chatId,
    title: d.data().title,
    messages: (d.data().messages ?? []) as Message[],
  }));

  useChatSlice.setState({
    conversations: convs,
    currentId: convs[0]?.id ?? null,
  });
});
