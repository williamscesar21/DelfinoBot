// components/MessageBubble.tsx
import { Message } from "../types/chat";
import "../styles/components/MessageBubble.css";

export default function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`bubble ${isUser ? "user" : "bot"}`}>
      {msg.cached && <span className="badge">cache</span>}
      {msg.content}
    </div>
  );
}
