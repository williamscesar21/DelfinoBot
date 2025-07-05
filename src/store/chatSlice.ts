/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api, getAuthCreds } from "../api/axios";
import type { Message } from "../types/chat";

/* ────────────────── tipos ────────────────── */
export interface Conversation {
  id: string;          // id local
  chatId: string;      // id backend
  title: string;
  messages: Message[];
}

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

/* util local */
const uuid = () => crypto.randomUUID();

/* ────────────────── store ────────────────── */
export const useChatSlice = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentId: null,
      selectedFiles: [],
      loading: false,

      /* ── crear chat ── */
      async newChat() {
        const { data } = await api.post("/chat/start");   // { chatId }
        const localId  = uuid();
        set((s) => ({
          conversations: [
            ...s.conversations,
            { id: localId, chatId: data.chatId, title: "Nuevo chat", messages: [] }
          ],
          currentId: localId
        }));
      },

      /* ── seleccionar chat ── */
      selectChat(id) {
        set({ currentId: id });
      },

      /* ── enviar mensaje + SSE ── */
      async sendMessage(text: string) {
        /* siempre asegura un chat existente */
        if (!get().currentId) await get().newChat();

        const { currentId, conversations } = get();
        const idx = conversations.findIndex(c => c.id === currentId);
        if (idx === -1) return;
        const conv = conversations[idx];

        /* optimistic UI */
        const userMsg: Message = {
          id: uuid(), role: "user", content: text, timestamp: Date.now()
        };
        const botId = uuid();          // placeholder
        const draftBot: Message = {
          id: botId, role: "assistant", content: "", timestamp: Date.now()
        };

        set((s) => {
          const list      = [...s.conversations];
          list[idx]       = {
            ...conv,
            title    : conv.messages.length ? conv.title : text,
            messages : [...conv.messages, userMsg, draftBot]
          };
          return { conversations: list, loading: true };
        });

        /* ---------- llamada SSE ---------- */
        const body = {
          chatId     : conv.chatId,
          message    : text,
          selectedIds: get().selectedFiles,
          stream     : true
        };

        /* cabeceras limpias */
        const { user, pass } = getAuthCreds();
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          "Accept"      : "text/event-stream"
        };
        if (user && pass) {
          headers.Authorization = "Basic " + btoa(`${user}:${pass}`);
        }

        try {
          const resp = await fetch(`${api.defaults.baseURL}/chat`, {
            method : "POST",
            headers,
            body   : JSON.stringify(body)
          });

          const reader  = resp.body?.getReader();
          if (!reader) throw new Error("No stream from server");

          const decoder = new TextDecoder();
          let   buffer  = "";

          /* lee trozos SSE */
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const chunks = buffer.split("\n\n");
            buffer = chunks.pop()!;            // resta lo incompleto

            chunks.forEach((chunk) => {
              if (!chunk.startsWith("data:")) return;
              const delta = chunk.slice(5);    // elimina "data:"
              /* actualiza el mensaje del bot en tiempo real */
              set((s) => {
                const cIdx = s.conversations.findIndex(c => c.id === currentId);
                if (cIdx === -1) return s;

                const msgs = s.conversations[cIdx].messages.map(m =>
                  m.id === botId ? { ...m, content: m.content + delta } : m
                );

                const list = [...s.conversations];
                list[cIdx] = { ...s.conversations[cIdx], messages: msgs };
                return { conversations: list };
              });
            });
          }
        } catch (err) {
          console.error("✖ sendMessage:", err);
        } finally {
          set({ loading: false });
        }
      },

      /* ── borrar chat ── */
      async deleteChat(id) {
        const conv = get().conversations.find(c => c.id === id);
        if (!conv) return;

        /* quita de la UI */
        set((s) => ({
          conversations: s.conversations.filter(c => c.id !== id),
          currentId    : s.currentId === id ? null : s.currentId
        }));

        /* intenta borrar en el backend (ignora fallo) */
        try { await api.delete(`/chat/${conv.chatId}`); }
        catch (err) { console.warn("Delete failed:", err); }
      },

      /* ── marcar / desmarcar archivo ── */
      toggleFile(id) {
        set((s) =>
          s.selectedFiles.includes(id)
            ? { selectedFiles: s.selectedFiles.filter(x => x !== id) }
            : { selectedFiles: [...s.selectedFiles, id] }
        );
      }
    }),
    {
      name   : "chat-storage",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
