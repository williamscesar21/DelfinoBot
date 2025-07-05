import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../api/axios";
import { Message } from "../types/chat";

/* ---------- Tipos ---------- */
export interface Conversation {
  id: string;
  chatId: string;
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

/* ---------- Store ---------- */
export const useChatSlice = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentId: null,
      selectedFiles: [],
      loading: false,

      /* ── crear chat ── */
      async newChat() {
        const { data } = await api.post("/chat/start");
        const localId  = uuid();
        set(s => ({
          conversations: [
            ...s.conversations,
            { id: localId, chatId: data.chatId, title: "Nuevo chat", messages: [] }
          ],
          currentId: localId
        }));
      },

      /* ── seleccionar ── */
      selectChat(id) { set({ currentId: id }); },

      /* ── enviar (stream) ── */
      async sendMessage(text: string) {
        let { currentId, conversations } = get();

        if (!currentId) {
          await get().newChat();
          currentId    = get().currentId!;
          conversations = get().conversations;
        }

        const idx = conversations.findIndex(c => c.id === currentId);
        if (idx === -1) return;
        const conv = conversations[idx];

        const userMsg: Message = {
          id: uuid(), role: "user", content: text, timestamp: Date.now()
        };
        const botId = uuid();
        const botMsg: Message = {
          id: botId, role: "assistant", content: "", timestamp: Date.now()
        };

        const draft = {
          ...conv,
          title: conv.messages.length ? conv.title : text,
          messages: [...conv.messages, userMsg, botMsg]
        };
        set(s => {
          const list      = [...s.conversations];
          list[idx]       = draft;
          return { conversations: list, loading: true };
        });

        /* -------------- petición -------------- */
        const body = {
          chatId: conv.chatId,
          message: text,
          selectedIds: get().selectedFiles,
          stream: true
        };

        /* convierte cabeceras Axios -> string */
        const axiosCommon = api.defaults.headers.common as Record<string, unknown>;
        const mergedHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          ...Object.fromEntries(
            Object.entries(axiosCommon).map(([k, v]) => [k, String(v)])
          )
        };

        try {
          const resp = await fetch(
            `${api.defaults.baseURL}/chat`,
            {
              method : "POST",
              headers: mergedHeaders,
              body   : JSON.stringify(body)
            }
          );

          const reader  = resp.body!.getReader();
          const decoder = new TextDecoder();
          let buffer    = "";

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const chunks = buffer.split("\n\n");
            buffer = chunks.pop()!;

            chunks.forEach(chunk => {
              if (!chunk.startsWith("data:")) return;
              const delta = chunk.slice(5);

              set(s => {
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
          console.error(err);
        } finally {
          set({ loading: false });
        }
      },

      /* ── borrar ── */
      async deleteChat(id) {
        const conv = get().conversations.find(c => c.id === id);
        if (!conv) return;

        set(s => ({
          conversations: s.conversations.filter(c => c.id !== id),
          currentId    : s.currentId === id ? null : s.currentId
        }));

        try { await api.delete(`/chat/${conv.chatId}`); }
        catch (err) { console.warn("Delete failed:", err); }
      },

      /* ── toggle archivo ── */
      toggleFile(id) {
        set(s =>
          s.selectedFiles.includes(id)
            ? { selectedFiles: s.selectedFiles.filter(x => x !== id) }
            : { selectedFiles: [...s.selectedFiles, id] }
        );
      }
    }),
    { name: "chat-storage", storage: createJSONStorage(() => localStorage) }
  )
);
