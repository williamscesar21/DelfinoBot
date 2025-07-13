import axios, { type AxiosRequestHeaders } from "axios";
import { useAuthSlice } from "../store/authSlice";

/* ---------- helper credenciales ---------- */
const getAuthCreds = () => {
  const { basicUser, basicPass } = useAuthSlice.getState();

  if (basicUser && basicPass) return { basicUser, basicPass };

  try {
    const raw = localStorage.getItem("auth-storage");
    if (!raw) return { basicUser: null, basicPass: null };
    const parsed = JSON.parse(raw) as {
      state?: { basicUser?: string; basicPass?: string };
    };
    return {
      basicUser: parsed.state?.basicUser ?? null,
      basicPass: parsed.state?.basicPass ?? null,
    };
  } catch {
    return { basicUser: null, basicPass: null };
  }
};

/* ---------- instancia ---------- */
export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://api-chatgpt-delfino.onrender.com/api",
  withCredentials: true,
});

/* ---------- interceptor request ---------- */
api.interceptors.request.use((config) => {
  const { basicUser, basicPass } = getAuthCreds();
  if (basicUser && basicPass) {
    /* Aquí mutamos el header respetando su tipo */
    if (config.headers) {
      (config.headers as AxiosRequestHeaders).Authorization =
        "Basic " + btoa(`${basicUser}:${basicPass}`);
    } else {
      config.headers = {
        Authorization: "Basic " + btoa(`${basicUser}:${basicPass}`),
      } as AxiosRequestHeaders;
    }
  }
  return config;
});

/* ---------- interceptor response ---------- */
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      useAuthSlice.getState().logout().catch(() => void 0);
    }
    return Promise.reject(err);
  }
);

export { getAuthCreds };
