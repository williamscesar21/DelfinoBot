import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "../api/axios";
import { useChatSlice } from "../store/chatSlice";
import TreeFileList, { FileItem } from "./TreeFileList";
import "../styles/components/FileSidebar.css";

type Props = {
  /** Drawer en móviles */
  mobile?: boolean;
  /** Abierto o cerrado (móviles) */
  open?: boolean;
  /** Callback al cerrar */
  onClose?: () => void;
};

export default function FileSidebar({
  mobile = false,
  open = false,
  onClose,
}: Props) {
  /* estado global */
  const { selectedFiles, toggleFile } = useChatSlice(); // IDs

  /* estado local */
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* fetch /api/files una sola vez */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<FileItem[]>("/files");
        setFiles(Array.isArray(data) ? data : []);
      } catch {
        setError("No se pudo cargar la lista de archivos.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <aside
      className={`file-sidebar ${mobile ? "mobile" : ""} ${
        open ? "open" : ""
      }`}
    >
      {/* Cerrar (solo móvil) */}
      {mobile && (
        <button className="file-close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      )}

      <h2 className="file-sidebar-title">Archivos</h2>

      {loading && <div className="file-sidebar-loading">Cargando…</div>}
      {error && <div className="file-sidebar-error">{error}</div>}

      {!loading && !error && (
        <nav className="file-sidebar-files">
          <TreeFileList
            files={files}
            selected={selectedFiles}
            onToggle={toggleFile}
          />
        </nav>
      )}

      {!selectedFiles.length && !loading && !error && (
        <p className="file-sidebar-hint" style={{ textAlign: "center" }}>
          Sin archivos seleccionados — se consultarán <strong>todos</strong>.
        </p>
      )}
    </aside>
  );
}
