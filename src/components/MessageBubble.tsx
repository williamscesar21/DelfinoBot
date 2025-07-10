import { Message }    from "../types/chat";
import { marked }     from "marked";
import { autoTable }  from "../utils/autoTable";
import "../styles/components/MessageBubble.css";

marked.setOptions({ gfm: true, breaks: true, async: false });

type Props = { msg: Message };

export default function MessageBubble({ msg }: Props) {
  const isUser  = msg.role === "user";

  /* ① reconstruimos y limpiamos la tabla */
  const fixedMd = autoTable(msg.content);

  /* ② Markdown → HTML */
  const html    = marked.parse(fixedMd) as string;

  return (
    <div className={`bubble ${isUser ? "user" : "bot"}`}>
      {msg.cached && <span className="badge">cache</span>}
      <div
        className="bubble-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
