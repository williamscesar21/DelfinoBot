/* src/App.tsx */
import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";import Login from "./pages/Login";
import Chat  from "./pages/Chat";
import { useAuthSlice } from "./store/authSlice";
import Toast from "./components/Toast";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* Loader */
const Loader = () => (
  <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
    <h2>Cargando…</h2>
  </div>
);

export default function App() {
  /* Zustand selectors */
  const isAuth    = useAuthSlice((s) => s.isAuth);
  const setAuth   = useAuthSlice((s) => s.setAuth);
  const clearAuth = useAuthSlice((s) => s.clearAuth);

  /* ready = Firebase ya emitió su primer valor */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user: User | null) => {
      user ? setAuth(user) : clearAuth();
      setReady(true);                 // ← ¡ya sabemos el estado real!
    });
    return unsub;
  }, [setAuth, clearAuth]);

  /* Mientras no se sepa si hay sesión, muestra loader */
  if (!ready) return <Loader />;

  return (
    <>
      <Routes>
        {/* raíz */}
        <Route
          path="/"
          element={<Navigate to={isAuth ? "/chat" : "/login"} replace />}
        />

        {/* Login solo para NO autenticados */}
        <Route
          path="/login"
          element={isAuth ? <Navigate to="/chat" replace /> : <Login />}
        />

        {/* Chat solo para autenticados */}
        <Route
          path="/chat"
          element={isAuth ? <Chat /> : <Navigate to="/login" replace />}
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toast />
      <ToastContainer position="bottom-right" />
    </>
  );
}
