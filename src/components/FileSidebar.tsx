import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { api } from "../api/axios";
import { useChatSlice } from "../store/chatSlice";
import TreeFileList, { FileItem } from "./TreeFileList";
import "../styles/components/FileSidebar.css";

type Props = {
  /** Drawer state cuando viewport < 768 px */
  mobileOpen?: boolean;
  /** callback para cerrar drawer (tap ❌ o overlay) */
  onClose?: () => void;
};

export default function FileSidebar({ mobileOpen = false, onClose }: Props) {
  /* --- responsive --- */
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const cb = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) onClose?.(); // vuelvo a desktop ⇒ cierro drawer
    };
    window.addEventListener("resize", cb);
    return () => window.removeEventListener("resize", cb);
  }, [onClose]);

  /* --- datos globales --- */
  const { selectedFiles, toggleFile } = useChatSlice();

  /* --- fetch archivos una sola vez --- */
  const [files, setFiles]     = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

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

  /* --- estado de colapso (solo desktop) --- */
  const [collapsed, setCollapsed] = useState(false);

  /* --- clases --- */
  const cls =
    "file-sidebar" +
    (isMobile ? " mobile" : "") +
    (isMobile && mobileOpen ? " open" : "") +
    (!isMobile && collapsed ? " collapsed" : "");

  /* --- render --- */
  return (
    <aside className={cls}>
      {/* ❌ solo en móvil */}
      {isMobile && mobileOpen && (
        <button className="file-close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      )}

      {/* ⬅/➡ toggle sólo en desktop */}
      {!isMobile && (
        <button
          className="file-collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
        >
          {/* En la barra derecha, flecha apunta → al colapsar, ← al expandir */}
          {collapsed ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      )}

      {/* ---- CONTENIDO ---- */}
      <h2 className="file-sidebar-title">Archivos</h2>

      {loading && <div className="file-sidebar-loading">Cargando…</div>}
      {error   && <div className="file-sidebar-error">{error}</div>}

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
        <p className="file-sidebar-hint">
          Sin archivos seleccionados — se consultarán <strong>todos</strong>.
        </p>
      )}
    </aside>
  );
}
