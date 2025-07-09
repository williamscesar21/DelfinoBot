import { useState } from "react";
import { useAiSettings } from "../store/aiSettings";
import "../styles/components/aiSettingsPanel.css";      // ⬅ importa los estilos de más abajo
import MarkdownEditor from "./MarkdownEditor";

interface AiSettingsPanelProps {
  onClose?: () => void;
}

export default function AiSettingsPanel({ onClose }: AiSettingsPanelProps) {
  /* ----- store global ----- */
  const {
    systemPrompt,
    maxCharsPerFile,
    maxHistory,
    setPrompt,
    setMaxChars,
    setMaxHistory,
  } = useAiSettings();

  /* ----- estado local para el prompt ----- */
  const [promptDraft, setPromptDraft] = useState<string>(systemPrompt);

  const handleSavePrompt = () => setPrompt(promptDraft.trim());

  return (
    <div className="ais-panel">
      {/* ---------- Prompt ---------- */}
      <section className="ais-section">
        <label className="ais-label" htmlFor="promptArea">
          Prompt del sistema
        </label>

        <MarkdownEditor
            value={promptDraft}
            onChange={setPromptDraft}
        />

        <button
          className="ais-btn"
          disabled={promptDraft.trim() === systemPrompt.trim()}
          onClick={handleSavePrompt}
        >
          Guardar prompt
        </button>
      </section>

      {/* ---------- maxCharsPerFile ---------- */}
      <section className="ais-section">
        <div className="ais-row">
          <span className="ais-label">Máx. caracteres por archivo</span>
          <span>{maxCharsPerFile.toLocaleString()}</span>
        </div>

        <input
          className="ais-range"
          type="range"
          min={1000}
          max={16000}
          step={500}
          value={maxCharsPerFile}
          onChange={(e) => setMaxChars(Number(e.target.value))}
        />
      </section>

      {/* ---------- maxHistory ---------- */}
      <section className="ais-section">
        <div className="ais-row">
          <span className="ais-label">Mensajes de historia</span>
          <span>{maxHistory}</span>
        </div>

        <input
          className="ais-input-number"
          type="number"
          min={0}
          max={20}
          value={maxHistory}
          onChange={(e) => setMaxHistory(Number(e.target.value))}
        />
      </section>

      {onClose && (
        <div className="ais-actions">
          <button className="ais-btn ais-btn--secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
