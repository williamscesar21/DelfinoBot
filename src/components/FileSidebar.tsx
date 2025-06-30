import { useEffect, useState } from "react";
import { api } from "../api/axios";
import { useChatSlice } from "../store/chatSlice";
import FileList, { FileItem } from "./FileList";
import "../styles/components/FileSidebar.css";

export default function FileSidebar() {
  /* estado global */
  const { selectedFiles, toggleFile } = useChatSlice(); // IDs

  /* estado local */
  const [files, setFiles]   = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

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
    <aside className="file-sidebar">
      <h2 className="file-sidebar-title">Archivos</h2>

      {loading && <div className="file-sidebar-loading">Cargando…</div>}
      {error   && <div className="file-sidebar-error">{error}</div>}

      {!loading && !error && (
        <nav className="file-sidebar-files">
          <FileList files={files} selected={selectedFiles} onToggle={toggleFile} />
        </nav>
      )}

      {!selectedFiles.length && !loading && !error && (
        <p className="file-sidebar-hint">
          Sin archivos seleccionados — se consultarán <strong>todos</strong>.
        </p>
      )}
    </aside>
  );
}
