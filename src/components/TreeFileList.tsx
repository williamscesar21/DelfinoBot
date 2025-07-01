import { useState } from "react";
import "../styles/components/FileList.css";

/* ---------- tipos ---------- */
export type FileItem = {
  id: string;
  name: string;
  path: string;
  webUrl: string;
};

export type Props = {
  files: FileItem[];
  selected: string[];
  onToggle: (id: string) => void;
};

/* nodo final que va a React */
type Node = { name: string; children?: Node[]; file?: FileItem };

/* nodo temporal con children como mapa (más cómodo para construir) */
type TmpNode = { name: string; children?: Record<string, TmpNode>; file?: FileItem };

/* ---------- construye árbol ---------- */
function buildTree(items: FileItem[]): Node[] {
  const root: Record<string, TmpNode> = {};

  items.forEach((f) => {
    const parts = f.path.split("/");          // ['Carpeta', 'Sub', 'Archivo']
    let level = root;

    parts.forEach((part, idx) => {
      level[part] ??= { name: part };
      if (idx === parts.length - 1) {
        level[part].file = f;                 // hoja
      } else {
        level[part].children ??= {};
      }
      level = level[part].children ?? {};
    });
  });

  /* convierte mapas en arrays ordenados alfabéticamente */
  const toArray = (map: Record<string, TmpNode>): Node[] =>
    Object.values(map)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((n) =>
        n.children
          ? { name: n.name, children: toArray(n.children), file: n.file }
          : { name: n.name, file: n.file }
      );

  return toArray(root);
}

/* ---------- componente recursivo ---------- */
function TreeNode({
  node,
  selected,
  onToggle,
}: {
  node: Node;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  /* carpeta */
  if (node.children) {
    return (
      <li>
        <button
          className="file-folder-btn"
          onClick={() => setOpen(!open)}
        >
          {open ? "▼" : "►"} {node.name}
        </button>
        {open && (
          <ul className="file-list-tree">
            {node.children.map((ch) => (
              <TreeNode
                key={ch.name + (ch.file?.id ?? "")}
                node={ch}
                selected={selected}
                onToggle={onToggle}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  /* archivo */
  if (node.file) {
    const file = node.file;
    const isSel = selected.includes(file.id);
    return (
      <li
        className={`file-item ${isSel ? "selected" : ""}`}
        onClick={() => onToggle(file.id)}
      >
        <label className="file-label">
          <input
            type="checkbox"
            className="file-checkbox"
            checked={isSel}
            onChange={() => onToggle(file.id)}
            tabIndex={-1}
          />
          <span className="file-name">{file.name}</span>
        </label>
      </li>
    );
  }

  return null;
}

/* ---------- componente principal ---------- */
export default function TreeFileList({ files, selected, onToggle }: Props) {
  if (!files.length)
    return <p className="file-list-empty">No hay archivos.</p>;

  const tree = buildTree(files);

  return (
    <ul className="file-list-tree">
      {tree.map((n) => (
        <TreeNode
          key={n.name}
          node={n}
          selected={selected}
          onToggle={onToggle}
        />
      ))}
    </ul>
  );
}
