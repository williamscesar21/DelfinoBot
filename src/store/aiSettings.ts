/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/* ── tipos ── */
export interface AiSettings {
  systemPrompt: string;
  maxCharsPerFile: number;
  maxHistory: number;

  setPrompt:     (p: string) => void;
  setMaxChars:   (n: number) => void;
  setMaxHistory: (n: number) => void;
}

/* ── store ── */
export const useAiSettings = create<AiSettings>()(
  persist(
    (set) => ({
      systemPrompt: import.meta.env.VITE_SYSTEM_PROMPT ??
`Eres **DelfinoBot**, asistente virtual de *Delfino Tours II*.

• Usa únicamente los fragmentos entre «<<<Archivo|chunk:n>>> … <<<FIN>>>».
• Cuando cites, indica (Archivo.ext · chunk:n).
• Si no está en los documentos, responde exactamente:
  Lo siento, no dispongo de esa información.
• Responde SIEMPRE en Markdown claro y conciso y con la referencia al archivo.
Recuerda siempre revisar todos los archivos si no se especifica uno
Y cada vez que te pregunten por algun precio revisar el Tarifario.`,
      maxCharsPerFile: 10_000,
      maxHistory: 8,

      setPrompt:     (p) => set({ systemPrompt: p }),
      setMaxChars:   (n) => set({ maxCharsPerFile: n }),
      setMaxHistory: (n) => set({ maxHistory: n }),
    }),
    { name: "ai-settings", storage: createJSONStorage(() => localStorage) },
  ),
);
