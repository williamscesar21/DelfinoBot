import { useEffect, useRef } from "react";
import { useChatSlice } from "../store/chatSlice";
import MessageBubble from "../components/MessageBubble";
import Spinner from "../components/Spinner";
import HistorySidebar from "../components/HistorySidebar";
import FileSidebar from "../components/FileSidebar";
import ChatInput from "../components/ChatInput";
import "../styles/components/Composer.css";

export default function Chat() {
  const { conversations, currentId, sendMessage, loading } =
    useChatSlice();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Conversación activa
  const activeConv = conversations.find((c) => c.id === currentId);
  const messages = activeConv?.messages || [];

  // Auto-scroll al mensaje más reciente
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Manejador para pasar a ChatInput
  const handleSend = async (text: string) => {
    await sendMessage(text);
  };

  return (
    <div className="app-layout">
      {/* Sidebar de historial */}
      <HistorySidebar />

      {/* Panel central de mensajes */}
      <div className="main-panel">
        <section className="messages">
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} />
          ))}
          {loading && <Spinner small />}
          <div ref={bottomRef} />
        </section>

        

        {/* Composer desacoplado */}
        <ChatInput disabled={loading} onSend={handleSend} />
        {/* {!selectedFiles.length && (
          <p style={{ textAlign: "center", color: "#9ca3af", bottom: '1rem' }}>
            Sin archivos seleccionados — se consultarán <strong>todos</strong>.
          </p>
        )} */}
      </div>

      {/* Sidebar de archivos */}
      <FileSidebar />
    </div>
  );
}
