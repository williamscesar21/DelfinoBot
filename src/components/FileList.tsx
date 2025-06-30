import "../styles/components/FileList.css";

export type FileItem = {
  id: string;
  name: string;
  path: string;
  webUrl: string;
};

export type FileListProps = {
  files: FileItem[];
  selected: string[];             // IDs seleccionados
  onToggle: (id: string) => void;
};

export default function FileList({ files, selected, onToggle }: FileListProps) {
  if (!files.length)
    return <p className="file-list-empty">No hay archivos.</p>;

  return (
    <ul className="file-list">
      {files.map((f) => (
        <li
          key={f.id}
          className={`file-item ${selected.includes(f.id) ? "selected" : ""}`}
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
  );
}
