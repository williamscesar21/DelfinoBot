import { useEffect, useRef, useState } from "react";
import { Menu, Folder, Settings } from "lucide-react";

import { useChatSlice } from "../store/chatSlice";
import MessageBubble from "../components/MessageBubble";
import HistorySidebar from "../components/HistorySidebar";
import FileSidebar from "../components/FileSidebar";
import ChatInput from "../components/ChatInput";
import "../styles/components/aiSettingsPanel.css";
import AiSettingsPanel from "../components/aiSettingsPanel";

// CSS global + panel de ajustes
import "../styles/components/Composer.css";
import "../styles/components/AppLayout.css";

export default function Chat() {
  /* ---------------- Estado global ---------------- */
  const { conversations, currentId, sendMessage, loading } = useChatSlice();

  /* ---------------- UI local ---------------- */
  const [showHistory,  setShowHistory]  = useState(false);
  const [showFiles,    setShowFiles]    = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  /* ---------------- Scroll al final ---------------- */
  const bottomRef  = useRef<HTMLDivElement>(null);
  const activeConv = conversations.find((c) => c.id === currentId);
  const messages   = activeConv?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* ---------------- Enviar ---------------- */
  const handleSend = async (text: string) => {
    await sendMessage(text);
  };

  /* ========================================================= */
  return (
    <div className="app-layout">
      {/* ---------- SIDEBARS (permanentes para mantener estado) ---------- */}
      <HistorySidebar
        mobile
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />
      

      {/* ---------- PANEL CENTRAL ---------- */}
      <div className="main-panel">
        {/* Barra superior (visible en móviles) */}
        <header className="chat-mobile-nav">
          <button onClick={() => setShowHistory(true)} className="nav-btn">
            <Menu size={20} />
          </button>

          <h1 className="chat-title">Delfino Tours II</h1>

          <div className="nav-right">
            <button onClick={() => setShowFiles(true)} className="nav-btn">
              <Folder size={20} />
            </button>
            <button onClick={() => setShowSettings(true)} className="nav-btn">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Lista de mensajes */}
        <section className="messages">
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} />
          ))}
          {/* Puedes volver a habilitar el Spinner si lo necesitas */}
          <div ref={bottomRef} />
        </section>

        <ChatInput disabled={loading} onSend={handleSend} />
      </div>

      {/* ---------- MODAL AJUSTES ---------- */}
      {showSettings && (
        <>
          {/* Overlay oscuro solo para el modal */}
          <div
            className="app-overlay"
            onClick={() => setShowSettings(false)}
          />

          {/* Contenedor centrado */}
          <div className="modal-wrapper">
            <AiSettingsPanel onClose={() => setShowSettings(false)} />
          </div>
        </>
      )}

      <FileSidebar
        mobile
        open={showFiles}
        onClose={() => setShowFiles(false)}
      />

      {/* ---------- BOTÓN FLOTANTE DE AJUSTES (siempre visible) ---------- */}
      <div
        className="settings-fab"
        onClick={() => setShowSettings(true)}
        title="Ajustes de IA"
      >
        <Settings size={20} />
      </div>

      {/* ---------- Overlay para sidebars ---------- */}
      {(showHistory || showFiles) && (
        <div
          className="app-overlay"
          onClick={() => {
            setShowHistory(false);
            setShowFiles(false);
          }}
        />
      )}
    </div>
  );
}
