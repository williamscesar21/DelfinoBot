/* src/pages/Login.tsx
   — Componente actualizado y 100 % responsive */

import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";
import "../styles/components/Login.css";

export default function Login() {
  const { isAuth, login } = useAuth();
  const nav = useNavigate();

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  /* Si ya está autenticado, redirige a Home */
  useEffect(() => {
    if (isAuth) nav("/", { replace: true });
  }, [isAuth, nav]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user || !pass) {
      toast.error("Por favor completa ambos campos");
      return;
    }

    setLoading(true);
    try {
      await login(user, pass);
      nav("/", { replace: true });
    } catch {
      toast.error("Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-wrapper">
      {/* ---------- HERO IZQUIERDO (solo desktop) ---------- */}
      <section className="login-hero">
        <div className="hero-overlay">
          <div className="hero-logo">
            <div className="dot" />
            <span>
              DELFINO
              <br />
              TOURS&nbsp;II
            </span>
          </div>

          <h2 className="hero-heading">
            Hola, 🤖
            <br />
            bienvenido
          </h2>

          <p className="hero-text">
            Esta plataforma te permite consultar rápidamente información con la ayuda
            de un asistente IA.
            <br />
            Inicia sesión para empezar a sacar el máximo provecho a tu información.
          </p>
        </div>
      </section>

      {/* ---------- FORMULARIO DERECHO (desktop + móvil) ---------- */}
      <section className="login-form-section">
        {/* Título exclusivo para móvil */}
        <h2 className="mobile-welcome">
            Hola, 🤖
            <br />
            bienvenido a DelfinoBot
          </h2>

        <div className="login-box">
          <h3 className="form-title">Iniciar sesión</h3>

          <form className="login-form" onSubmit={onSubmit}>
            <label>
              <span>Usuario</span>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                required
                autoComplete="username"
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>

            <div className="login-actions">
              <button type="submit" disabled={loading}>
                {loading ? "…" : "Iniciar sesión"}
              </button>

              <button
                type="button"
                className="outline"
                onClick={() => toast.info("Función no implementada")}
              >
                Registrarse
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
