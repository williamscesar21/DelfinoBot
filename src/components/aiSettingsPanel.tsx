import { useState } from "react";
// import { toast } from "react-toastify";          // npm i react-toastify
import { useAiSettings } from "../store/aiSettings";
// import { api } from "../api/axios";
import MarkdownEditor from "./MarkdownEditor";
import "../styles/components/aiSettingsPanel.css";

interface AiSettingsPanelProps {
  onClose?: () => void;
}

/* --- valores por defecto (mismos que en tu store) --- */
const DEFAULT_PROMPT = `Eres **DelfinoBot**, asistente virtual de *Delfino Tours II*.

• Usa únicamente los fragmentos entre «<<<Archivo|chunk:n>>> … <<<FIN>>>».
• Cuando cites, indica (Archivo.ext · chunk:n).
• Si no está en los documentos, responde exactamente:
  Lo siento, no dispongo de esa información.
• Responde SIEMPRE en Markdown claro y conciso y con la referencia al archivo.
Recuerda siempre revisar todos los archivos si no se especifica uno
Y cada vez que te pregunten por algun precio revisar el Tarifario.
Siempre que pidan fechas de las SEASON en el Modelo Tarifario PANAMA 2025 V4 las sacaras de las columnas 9 y 11 del Modelo Tarifario PANAMA 2025 V4`;
const DEFAULT_MAX_CHARS   = 10_000;
const DEFAULT_MAX_HISTORY = 8;

export default function AiSettingsPanel({ }: AiSettingsPanelProps) {
  /* ---------- store global ---------- */
  const {
    systemPrompt,
    maxCharsPerFile,
    maxHistory,
    setPrompt,
    setMaxChars,
    setMaxHistory,
  } = useAiSettings();

  /* ---------- estado local ---------- */
  const [promptDraft, setPromptDraft] = useState(systemPrompt);
  // const [isReindexing, setIsReindexing] = useState(false);
  // console.log(isReindexing);
  /* ---------- acciones ---------- */
  const handleSavePrompt = () => setPrompt(promptDraft.trim());

  const handleReset = () => {
    setPrompt(DEFAULT_PROMPT);
    setMaxChars(DEFAULT_MAX_CHARS);
    setMaxHistory(DEFAULT_MAX_HISTORY);
    setPromptDraft(DEFAULT_PROMPT);
  };

  // const handleReindex = async () => {
  //   setIsReindexing(true);
  //   try {
  //     await api.post("/files/reindex");      // ← nueva ruta del backend
  //     toast.success("Índice actualizado correctamente");
  //   } catch (err) {
  //     console.error(err);
  //     toast.error("No se pudo actualizar el índice");
  //   } finally {
  //     setIsReindexing(false);
  //   }
  // };

  /* ---------- UI ---------- */
  return (
    <div className="ais-panel">
      {/* ---------- Prompt ---------- */}
      <section className="ais-section">
        <label className="ais-label">Prompt del sistema</label>

        <MarkdownEditor value={promptDraft} onChange={setPromptDraft} />

        <div className="ais-row" style={{ gap: "8px", flexWrap: "wrap" }}>
          <button
            className="ais-btn"
            disabled={promptDraft.trim() === systemPrompt.trim()}
            onClick={handleSavePrompt}
          >
            Guardar prompt
          </button>

          <button
            className="ais-btn ais-btn--secondary"
            onClick={handleReset}
          >
            Restablecer valores
          </button>

          {/* <button
            className="ais-btn ais-btn--warning"
            onClick={handleReindex}
            disabled={isReindexing}
          >
            {isReindexing ? "Actualizando…" : "Actualización de archivos"}
          </button> */}
        </div>
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

      {/* {onClose && (
        <div className="ais-actions">
          <button
            className="ais-btn ais-btn--secondary"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      )} */}
    </div>
  );
}
