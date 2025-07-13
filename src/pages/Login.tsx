/* Componente 100 % responsive: login, registro y Google Sign-In + Forgot-Password */
import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  UserCredential,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import "../styles/components/Login.css";

export default function Login() {
  const nav = useNavigate();
  const [user, setUser]       = useState("");
  const [pass, setPass]       = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  /* Redirige si ya hay sesión */
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => u && nav("/", { replace: true }));
    return unsub;
  }, [nav]);

  /* Login / Registro */
  const authAction = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !pass) {
      toast.error("Por favor completa ambos campos");
      return;
    }

    setLoading(true);
    let cred: UserCredential | null = null;
    try {
      cred = isRegister
        ? await createUserWithEmailAndPassword(auth, user, pass)
        : await signInWithEmailAndPassword(auth, user, pass);

      toast.success(
        isRegister
          ? `Bienvenido ${cred.user.email}! Registro exitoso`
          : "¡Sesión iniciada!"
      );
      nav("/", { replace: true });
    } catch (err: any) {
      toast.error(
        err.code === "auth/email-already-in-use"
          ? "Este correo ya está registrado"
          : "Credenciales incorrectas"
      );
    } finally {
      setLoading(false);
    }
  };

  /* Google Sign-In */
  const googleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("¡Sesión iniciada con Google!");
      nav("/", { replace: true });
    } catch (err: any) {
      toast.error("Error con Google: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* Forgot-Password */
  const forgotPassword = async () => {
    if (!user) {
      toast.info("Introduce tu correo primero");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, user);
      toast.success("Revisa tu bandeja de entrada para restablecer la contraseña");
    } catch (err: any) {
      toast.error("No se pudo enviar el correo: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-wrapper">
      {/* ----- Hero (desktop) ----- */}
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
            Esta plataforma te permite consultar rápidamente información con la ayuda de un asistente IA.
            Inicia sesión para empezar a sacar el máximo provecho a tu información.
          </p>
        </div>
      </section>

      {/* ----- Formulario ----- */}
      <section className="login-form-section">
        <h2 className="mobile-welcome">
          Hola, 🤖
          <br />
          bienvenido a DelfinoBot
        </h2>

        <div className="login-box">
          <h3 className="form-title">
            {isRegister ? "Crear cuenta" : "Iniciar sesión"}
          </h3>

          <form className="login-form" onSubmit={authAction}>
            <label>
              <span>Correo</span>
              <input
                type="email"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                required
                autoComplete="username"
              />
            </label>

            <label>
              <span>Contraseña</span>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
            </label>

            {/* Enlace olvide mi contraseña solo en modo login */}
            {!isRegister && (
              <button
                type="button"
                className="link-btn"
                onClick={forgotPassword}
                disabled={loading}
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}

            <div className="login-actions">
              <button type="submit" disabled={loading}>
                {loading ? "…" : isRegister ? "Registrarme" : "Iniciar sesión"}
              </button>

              <button
                type="button"
                className="outline"
                disabled={loading}
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? "Ya tengo cuenta" : "Registrarse"}
              </button>
            </div>
          </form>

          <button
            className="google-btn"
            onClick={googleLogin}
            disabled={loading}
          >
            <img src="/google.svg" alt="" /> Entrar con Google
          </button>
        </div>
      </section>
    </main>
  );
}
