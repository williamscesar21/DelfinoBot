import { useEffect, useRef, useState } from "react";
import { Menu, Folder, Settings } from "lucide-react";

import { useChatSlice } from "../store/chatSlice";
// import { useAuthSlice } from "../store/authSlice";
import MessageBubble    from "../components/MessageBubble";
import HistorySidebar   from "../components/HistorySidebar";
import FileSidebar      from "../components/FileSidebar";
import ChatInput        from "../components/ChatInput";
import AiSettingsPanel  from "../components/aiSettingsPanel";

import "../styles/components/aiSettingsPanel.css";
import "../styles/components/Composer.css";
import "../styles/components/AppLayout.css";

export default function Chat() {
  /* ---------- estado global ---------- */
  const { conversations, currentId, sendMessage, loading } = useChatSlice();
  // const { logout } = useAuthSlice();

  /* ---------- estado UI ---------- */
  const [showHistory,  setShowHistory]  = useState(false);
  const [showFiles,    setShowFiles]    = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  /* ---------- scroll automático ---------- */
  const bottomRef  = useRef<HTMLDivElement>(null);
  const activeConv = conversations.find((c) => c.id === currentId);
  const messages   = activeConv?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* ---------- enviar mensaje ---------- */
  const handleSend = async (text: string) => {
    await sendMessage(text);
  };

  /* ============================================================= */
  return (
    <div className="app-layout">
      {/* ---------- SIDEBAR HISTÓRICO ---------- */}
      <HistorySidebar
        mobileOpen={showHistory}          /* ← nuevo prop */
        onClose={() => setShowHistory(false)}
      />

      {/* ---------- PANEL CENTRAL ---------- */}
      <div className="main-panel">
        {/* Nav superior (solo móvil) */}
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

        {/* Mensajes */}
        <section className="messages">
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} />
          ))}
          <div ref={bottomRef} />
        </section>

        <ChatInput disabled={loading} onSend={handleSend} />
      </div>

      {/* ---------- PANEL AJUSTES ---------- */}
      {showSettings && (
        <>
          <div className="app-overlay" onClick={() => setShowSettings(false)} />
          <div className="modal-wrapper">
            <AiSettingsPanel onClose={() => setShowSettings(false)} />
          </div>
        </>
      )}

      {/* ---------- FILE SIDEBAR (sin cambios) ---------- */}
      <FileSidebar
        mobileOpen={showFiles}
        onClose={() => setShowFiles(false)}
      />

      {/* ---------- FAB ajustes ---------- */}
      <div
        className="settings-fab"
        onClick={() => setShowSettings(true)}
        title="Ajustes de IA"
      >
        <Settings size={20} />
      </div>

      {/* ---------- OVERLAY para sidebars móviles ---------- */}
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
