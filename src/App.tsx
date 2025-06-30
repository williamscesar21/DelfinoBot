import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import { useAuthSlice } from "./store/authSlice";
import Toast from "./components/Toast";

export default function App() {
  const isAuth = useAuthSlice((s) => s.isAuth);

  return (
    <>
      <Routes>
        {/* Raíz: Login o Chat según sesión */}
        <Route path="/" element={isAuth ? <Chat /> : <Login />} />

        {/* Compat. enlaces antiguos */}
        <Route path="/chat" element={<Navigate to="/" replace />} />

        {/* 404 → raíz */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </>
  );
}
