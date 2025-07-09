import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../styles/components/MarkdownEditor.css";

interface MarkdownEditorProps {
  value: string;
  onChange: (v: string) => void;
}

/** Editor + pestaña Vista previa */
export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  return (
    <div className="md-editor">
      {/* --- pestañas --- */}
      <div className="md-tabs">
        <button
          className={tab === "edit" ? "active" : ""}
          onClick={() => setTab("edit")}
        >
          Editor
        </button>
        <button
          className={tab === "preview" ? "active" : ""}
          onClick={() => setTab("preview")}
        >
          Vista previa
        </button>
      </div>

      {/* --- contenido --- */}
      {tab === "edit" ? (
        <textarea
          className="md-textarea"
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
        />
      ) : (
        <div className="md-preview">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
