// components/Sidebar.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FileList, { FileItem } from "./FileList";
import { useChatSlice } from "../store/chatSlice";
import { useAuthSlice } from "../store/authSlice";
import { api } from "../api/axios";
import "../styles/components/Sidebar.css";

export default function Sidebar() {
  const { selectedFiles, toggleFile } = useChatSlice();
  const { logout } = useAuthSlice();
  const nav = useNavigate();

  const [files, setFiles] = useState<FileItem[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<FileItem[]>("/files");
        setFiles(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando archivos", err);
      }
    })();
  }, []);

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Documentos</h2>
      <nav className="sidebar-files">
        <FileList files={files} selected={selectedFiles} onToggle={toggleFile} />
      </nav>

      <div className="sidebar-bottom">
        <button
          className="logout-btn"
          onClick={() => {
            logout();
            nav("/", { replace: true });
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
