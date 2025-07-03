import { useEffect, useRef, useState } from "react";
import { Menu, Folder } from "lucide-react";
import { useChatSlice } from "../store/chatSlice";
import MessageBubble from "../components/MessageBubble";
import Spinner from "../components/Spinner";
import HistorySidebar from "../components/HistorySidebar";
import FileSidebar from "../components/FileSidebar";
import ChatInput from "../components/ChatInput";
import "../styles/components/Composer.css";
import "../styles/components/AppLayout.css";   // ⟵ nuevo CSS global

export default function Chat() {
  const { conversations, currentId, sendMessage, loading } = useChatSlice();
  const [showHistory, setShowHistory] = useState(false);
  const [showFiles,   setShowFiles]   = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const activeConv = conversations.find((c) => c.id === currentId);
  const messages   = activeConv?.messages || [];

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    await sendMessage(text);
  };

  return (
    <div className="app-layout">
      {/* -------- Sidebars (se montan SIEMPRE para conservar estado) -------- */}
      <HistorySidebar
        mobile
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />
      

      {/* -------- Panel central -------- */}
      <div className="main-panel">
        {/* Barra superior SOLO móvil */}
        <header className="chat-mobile-nav">
          <button onClick={() => setShowHistory(true)} className="nav-btn">
            <Menu size={20} />
          </button>
          <h1 className="chat-title">Delfino Tours II</h1>
          <button onClick={() => setShowFiles(true)} className="nav-btn">
            <Folder size={20} />
          </button>
        </header>

        <section className="messages">
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} />
          ))}
          {loading && <Spinner small />}
          <div ref={bottomRef} />
        </section>

        <ChatInput disabled={loading} onSend={handleSend} />
      </div>
      <FileSidebar
        mobile
        open={showFiles}
        onClose={() => setShowFiles(false)}
      />

      {/* -------- Overlay oscuro -------- */}
      {(showHistory || showFiles) && (
        <div
          className="sidebar-overlay"
          onClick={() => {
            setShowHistory(false);
            setShowFiles(false);
          }}
        />
      )}
    </div>
  );
}
