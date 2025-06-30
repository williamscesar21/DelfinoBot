import { useState } from "react";
import "../styles/components/FileList.css";

export type FileItem = {
  id: string;
  name: string;
  path: string;      // e.g. "Folletos 2025/Promos.docx"
  webUrl: string;
};

export type Props = {
  files: FileItem[];
  selected: string[];          // IDs seleccionados
  onToggle: (id: string) => void;
};

/* ---- util: agrupar por la primera carpeta ---- */
const groupByFolder = (items: FileItem[]) => {
  const map = new Map<string, FileItem[]>();
  items.forEach((f) => {
    const folder = f.path.split("/")[0] || "(root)";
    (map.get(folder) ?? map.set(folder, []).get(folder)!).push(f);
  });
  return Array.from(map.entries()); // [ [folder, files[]], ... ]
};

export default function GroupedFileList({ files, selected, onToggle }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  if (!files.length)
    return <p className="file-list-empty">No hay archivos.</p>;

  return (
    <ul className="file-list-grouped">
      {groupByFolder(files).map(([folder, items]) => (
        <li key={folder}>
          <button
            className="file-folder-btn"
            onClick={() => setOpen((s) => ({ ...s, [folder]: !s[folder] }))}
          >
            {open[folder] ? "▼" : "►"} {folder}
          </button>

          {open[folder] && (
            <ul className="file-list">
              {items.map((f) => (
                <li
                  key={f.id}
                  className={`file-item ${
                    selected.includes(f.id) ? "selected" : ""
                  }`}
                  onClick={() => onToggle(f.id)}
                >
                  <label className="file-label">
                    <input
                      type="checkbox"
                      className="file-checkbox"
                      checked={selected.includes(f.id)}
                      onChange={() => onToggle(f.id)}
                      aria-label={`Seleccionar ${f.name}`}
                      tabIndex={-1}
                    />
                    <span className="file-name">{f.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
