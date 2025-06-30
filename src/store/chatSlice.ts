import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../api/axios";
import { Message } from "../types/chat";

/* ---------- Tipos ---------- */
export interface Conversation {
  id: string;        // id local (UI)
  chatId: string;    // id del backend
  title: string;
  messages: Message[];
}

type ChatState = {
  conversations: Conversation[];
  currentId: string | null;

  /*  ids (no nombres) de los archivos seleccionados  */
  selectedFiles: string[];

  loading: boolean;

  newChat: () => Promise<void>;
  selectChat: (id: string) => void;
  sendMessage: (text: string) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;

  /* toggle por id de archivo */
  toggleFile: (id: string) => void;
};

/* ---------- Store ---------- */
export const useChatSlice = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentId: null,
      selectedFiles: [],
      loading: false,

      /* ─── Crear chat ─── */
      newChat: async () => {
        const { data } = await api.post("/chat/start"); // { chatId }
        const localId = crypto.randomUUID();
        set((s) => ({
          conversations: [
            ...s.conversations,
            {
              id: localId,
              chatId: data.chatId,
              title: "Nuevo chat",
              messages: [],
            },
          ],
          currentId: localId,
        }));
      },

      /* ─── Seleccionar chat ─── */
      selectChat: (id) => set({ currentId: id }),

      /* ─── Enviar mensaje ─── */
      sendMessage: async (text) => {
        let { currentId, conversations } = get();

        // crea chat si no existe
        if (!currentId) {
          await get().newChat();
          currentId = get().currentId!;
          conversations = get().conversations;
        }

        const idx = conversations.findIndex((c) => c.id === currentId);
        if (idx === -1) return;
        const conv = conversations[idx];

        /* mensaje del usuario (optimistic) */
        const userMsg: Message = {
          id: crypto.randomUUID(),
          role: "user",
          content: text,
          timestamp: Date.now(),
        };

        const draft: Conversation = {
          ...conv,
          title: conv.messages.length ? conv.title : text,
          messages: [...conv.messages, userMsg],
        };
        const draftList = [...conversations];
        draftList[idx] = draft;
        set({ conversations: draftList, loading: true });

        /* payload para /chat */
        const { selectedFiles } = get();
        const body = {
          chatId: conv.chatId,
          message: text,
          selectedIds: selectedFiles,      //  <<< =====
        };

        try {
          const { data } = await api.post("/chat", body); // { answer, cached? }

          const botMsg: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.answer,
            timestamp: Date.now(),
            cached: data.cached,
          };

          const updated = [...get().conversations];
          updated[idx] = { ...draft, messages: [...draft.messages, botMsg] };
          set({ conversations: updated, loading: false });
        } catch (err) {
          console.error(err);
          set({ loading: false });
          throw err;
        }
      },

      /* ─── Borrar chat ─── */
      deleteChat: async (id) => {
        const conv = get().conversations.find((c) => c.id === id);
        if (!conv) return;

        // Optimistic: quita de la UI
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          currentId: s.currentId === id ? null : s.currentId,
        }));

        // Intenta borrar en el backend (ignora error si no existe endpoint)
        try {
          await api.delete(`/chat/${conv.chatId}`);
        } catch (err) {
          console.warn("No se pudo borrar en backend:", err);
        }
      },

      /* ─── Añadir/Eliminar archivo de contexto (por ID) ─── */
      toggleFile: (id) =>
        set((s) =>
          s.selectedFiles.includes(id)
            ? { selectedFiles: s.selectedFiles.filter((x) => x !== id) }
            : { selectedFiles: [...s.selectedFiles, id] }
        ),
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
