import axios from "axios";
import { useAuthSlice } from "../store/authSlice";

/* ---- lee user/pass del store o de localStorage (zustand-persist) ---- */
const getAuthCreds = () => {
  const { user, pass } = useAuthSlice.getState();
  if (user && pass) return { user, pass };

  try {
    const raw = localStorage.getItem("auth-storage");
    if (!raw) return { user: null, pass: null };
    const parsed = JSON.parse(raw) as { state?: { user: string; pass: string } };
    return {
      user: parsed.state?.user ?? null,
      pass: parsed.state?.pass ?? null,
    };
  } catch {
    return { user: null, pass: null };
  }
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://api-chatgpt-delfino.onrender.com/api",
  withCredentials: true,          // permite enviar cookies si las usaras
});

/* ----- interceptor: añade Authorization Basic ----- */
api.interceptors.request.use((config) => {
  const { user, pass } = getAuthCreds();
  if (user && pass) {
    config.headers.Authorization = "Basic " + btoa(`${user}:${pass}`);
  }
  return config;
});

/* ----- interceptor: si el backend devuelve 401 → logout global ----- */
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) useAuthSlice.getState().logout();
    return Promise.reject(err);
  }
);

export {getAuthCreds };  