import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../api/axios";
import { User, signOut } from "firebase/auth";
import { auth } from "../firebase";

/* ------------------------------------------------------------------
   Estado + acciones
------------------------------------------------------------------ */
interface AuthState {
  /* --- HTTP Basic --- */
  basicUser: string | null;
  basicPass: string | null;

  /* --- Firebase --- */
  firebaseUser: User | null;

  isAuth: boolean;

  /* Acciones */
  login: (u: string, p: string) => Promise<void>;
  logout: () => Promise<void>;

  setAuth: (u: User) => void;
  clearAuth: () => void;
}

/* ------------------------------------------------------------------
   Slice Zustand con persistencia selectiva
------------------------------------------------------------------ */
export const useAuthSlice = create<AuthState>()(
  persist(
    (set, get) => ({
      basicUser:    null,
      basicPass:    null,
      firebaseUser: null,
      isAuth:       false,

      /* ---------- LOGIN BÁSICO ---------- */
      login: async (u, p) => {
        await api.get("/files", {
          headers: { Authorization: "Basic " + btoa(`${u}:${p}`) },
        });
        set({
          basicUser: u,
          basicPass: p,
          firebaseUser: null,
          isAuth: true,
        });
      },

      /* ---------- LOGOUT GLOBAL ---------- */
      logout: async () => {
        /* Cierra sesión Firebase si está activa */
        if (get().firebaseUser) {
          try { await signOut(auth); } catch { /* ignora error */ }
        }
        /* Limpia todo */
        set({
          basicUser:    null,
          basicPass:    null,
          firebaseUser: null,
          isAuth: false,
        });
      },

      /* ---------- SETTERS (Firebase) ---------- */
      setAuth: (u) =>
        set({
          firebaseUser: u,
          isAuth: true,
          basicUser: null,
          basicPass: null,
        }),

      clearAuth: () =>
        set({
          firebaseUser: null,
          isAuth: false,
          basicUser: null,
          basicPass: null,
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),

      /* Solo persistimos lo mínimo para Basic Login;
         la sesión Firebase se restaura con sus propias cookies. */
      partialize: (s) => ({
        basicUser: s.basicUser,
        basicPass: s.basicPass,
        isAuth:    s.basicUser && s.basicPass ? s.isAuth : false,
      }),
    }
  )
);
