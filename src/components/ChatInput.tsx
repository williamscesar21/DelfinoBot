import { FormEvent, useState, useEffect, KeyboardEvent } from "react";
import { useChatSlice } from "../store/chatSlice";
import "../styles/components/ChatInput.css";

type Props = {
  disabled: boolean;
  onSend: (text: string) => void;
};

export default function ChatInput({ disabled, onSend }: Props) {
  const [text, setText] = useState("");
  const { conversations, currentId } = useChatSlice();

  const active = conversations.find((c) => c.id === currentId);
  const isEmpty = !active || active.messages.length === 0;

  const [username, setUsername] = useState<string | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth-storage");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUsername(parsed?.state?.user ?? null);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const send = (msg: string) => {
    onSend(msg);
    setText("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    send(msg);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const msg = text.trim();
      if (msg && !disabled) send(msg);
    }
  };

  return (
    <div className="chat-input-wrapper">
      {isEmpty && (
        <div className="chat-hero-box">
          <h2>¡Bienvenido{username ? `, ${username}` : ""}!</h2>
          <p>Puedes preguntar cualquier cosa sobre tus documentos.</p>
        </div>
      )}

      <form className="chat-input" onSubmit={handleSubmit}>
        <textarea
          className="chat-input-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje…"
          maxLength={1000}
          disabled={disabled}
          rows={1}
        />
        <button
          className="chat-input-button"
          type="submit"
          disabled={disabled || !text.trim()}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
