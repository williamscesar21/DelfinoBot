import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../api/axios";

type State = {
  user: string | null;
  pass: string | null;
  isAuth: boolean;
  login: (u: string, p: string) => Promise<void>;
  logout: () => void;
};

export const useAuthSlice = create<State>()(
  persist(
    (set) => ({
      user: null,
      pass: null,
      isAuth: false,
      login: async (u, p) => {
        await api.get("/files", { headers: { Authorization: "Basic " + btoa(`${u}:${p}`) } });
        set({ user: u, pass: p, isAuth: true });
      },
      logout: () => set({ user: null, pass: null, isAuth: false }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, pass: s.pass, isAuth: s.isAuth }),
    }
  )
);
