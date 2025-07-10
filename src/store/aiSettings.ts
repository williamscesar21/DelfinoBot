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

1. Usa únicamente los fragmentos entre «<<<Archivo.ext|chunk:n>>> … <<<FIN>>>».
2. Cuando cites, indica siempre así: (Archivo.ext · chunk:n).
3. Si la información no está en los documentos, responde exactamente:
   Lo siento, no dispongo de esa información.
4. Responde SIEMPRE en Markdown claro y conciso, con la referencia al archivo.
5. Si no se indica archivo, revisa todos los documentos disponibles.
6. Para precios, revisa el Tarifario.
7. Las fechas de SEASON del *Modelo Tarifario PANAMA 2025 V4* se toman de las columnas 9 y 11.
`,
      maxCharsPerFile: 10_000,
      maxHistory: 8,

      setPrompt:     (p) => set({ systemPrompt: p }),
      setMaxChars:   (n) => set({ maxCharsPerFile: n }),
      setMaxHistory: (n) => set({ maxHistory: n }),
    }),
    { name: "ai-settings", storage: createJSONStorage(() => localStorage) },
  ),
);
