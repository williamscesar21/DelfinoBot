import { Message } from "../types/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../styles/components/MessageBubble.css";

type Props = {
  msg: Message;
};

export default function MessageBubble({ msg }: Props) {
  const isUser = msg.role === "user";

  return (
    <div className={`bubble ${isUser ? "user" : "bot"}`}>
      {msg.cached && <span className="badge">cache</span>}
      <div className="bubble-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
      </div>
    </div>
  );
}
