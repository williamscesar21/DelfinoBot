/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api, getAuthCreds } from "../api/axios";
import { useAiSettings } from "./aiSettings";          // 👈 nuevo import
import type { Message } from "../types/chat";

/* ────────── tipos ────────── */
export interface Conversation {
  id: string;           // id local (UI)
  chatId: string;       // id backend
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

/* util */
const uuid = () => crypto.randomUUID();

/* ────────── store ────────── */
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
            { id: localId, chatId: data.chatId, title: "Nuevo chat", messages: [] },
          ],
          currentId: localId,
        }));
      },

      /* ── seleccionar chat ── */
      selectChat(id) { set({ currentId: id }); },

      /* ── enviar mensaje ── */
      async sendMessage(text: string) {
        /* 0️⃣ asegura conversación */
        if (!get().currentId) await get().newChat();

        const { currentId, conversations } = get();
        const idx  = conversations.findIndex((c) => c.id === currentId);
        if (idx === -1) return;
        const conv = conversations[idx];

        /* 1️⃣ optimistic UI */
        const userMsg: Message = {
          id: uuid(), role: "user", content: text, timestamp: Date.now(),
        };
        const botId = uuid();
        const botMsg: Message = {
          id: botId, role: "assistant", content: "", timestamp: Date.now(),
        };

        set((s) => {
          const list = [...s.conversations];
          list[idx]  = {
            ...conv,
            title   : conv.messages.length ? conv.title : text,
            messages: [...conv.messages, userMsg, botMsg],
          };
          return { conversations: list, loading: true };
        });

        /* 2️⃣ ajustes actuales de IA (prompt / límites) */
        const {
          systemPrompt,
          maxCharsPerFile,
          maxHistory,
        } = useAiSettings.getState();

        /* 3️⃣  prepara petición */
        const body = {
          chatId     : conv.chatId,
          message    : text,
          selectedIds: get().selectedFiles,
          stream     : true,

          /* 👇 se envían al backend */
          systemPrompt,
          maxCharsPerFile,
          maxHistory,
        };

        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Accept        : "text/event-stream,application/json",
        };
        const { basicUser, basicPass } = getAuthCreds();

        if (basicUser && basicPass) {
          headers.Authorization = "Basic " + btoa(`${basicUser}:${basicPass}`);
        }


        /* 4️⃣ fetch */
        try {
          const resp = await fetch(`${api.defaults.baseURL}/chat`, {
            method : "POST",
            headers,
            body   : JSON.stringify(body),
          });

          if (!resp.ok) {
            const errTxt = await resp.text();
            throw new Error(`HTTP ${resp.status}: ${errTxt}`);
          }

          const ctype = resp.headers.get("content-type") ?? "";

          /* --- 4A. STREAM (SSE) --- */
          if (ctype.startsWith("text/event-stream")) {
            const reader  = resp.body!.getReader();
            const decoder = new TextDecoder();
            let   buffer  = "";

            while (true) {
              const { value, done } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const chunks = buffer.split("\n\n");
              buffer = chunks.pop()!;

              chunks.forEach((chunk) => {
                if (!chunk.startsWith("data:")) return;
                const delta = chunk.slice(5);
                patchBot(delta);
              });
            }
          }
          /* --- 4B. JSON normal --- */
          else if (ctype.includes("application/json")) {
            const json: { answer?: string; error?: string } = await resp.json();
            patchBot(json.answer ?? json.error ?? "[sin respuesta]", true);
          }
          /* --- 4C. Texto plano u otros --- */
          else {
            const txt = await resp.text();
            patchBot(txt.trim() || "[sin respuesta]", true);
          }
        } catch (err) {
          console.error("✖ sendMessage", err);
          patchBot("Lo siento, ocurrió un error al procesar tu solicitud.", true);
        } finally {
          set({ loading: false });
        }

        /* helper local para inyectar contenido al mensaje del bot */
        function patchBot(delta: string, end = false) {
          set((s) => {
            const cIdx = s.conversations.findIndex((c) => c.id === currentId);
            if (cIdx === -1) return s;
            const msgs = s.conversations[cIdx].messages.map((m) =>
              m.id === botId
                ? { ...m, content: end ? delta : m.content + delta }
                : m,
            );
            const list = [...s.conversations];
            list[cIdx] = { ...s.conversations[cIdx], messages: msgs };
            return { conversations: list };
          });
        }
      },

      /* ── borrar chat ── */
      async deleteChat(id) {
        const conv = get().conversations.find((c) => c.id === id);
        if (!conv) return;

        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          currentId    : s.currentId === id ? null : s.currentId,
        }));

        try { await api.delete(`/chat/${conv.chatId}`); }
        catch { /* silencio */ }
      },

      /* ── seleccionar/deseleccionar archivo ── */
      toggleFile(id) {
        set((s) =>
          s.selectedFiles.includes(id)
            ? { selectedFiles: s.selectedFiles.filter((x) => x !== id) }
            : { selectedFiles: [...s.selectedFiles, id] },
        );
      },
    }),
    { name: "chat-storage", storage: createJSONStorage(() => localStorage) },
  ),
);
