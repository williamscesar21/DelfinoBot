import { useState } from "react";
import {
  FiChevronRight,
  FiChevronDown,
  FiFolder,         // ✅  existe en react-icons/fi
  FiFileText,
} from "react-icons/fi";

import {
  PiMicrosoftWordLogo as SiMicrosoftWord,   //  ← Word
  PiMicrosoftExcelLogo as SiMicrosoftExcel,  //  ← Excel
} from "react-icons/pi";

import "./FancyFileTree.css";

/* ---------- tipos ---------- */
export interface FileItem {
  id: string;
  name: string;
  path: string;      // “Folder/Sub/Archivo.docx”
  webUrl: string;
}

interface Props {
  files: FileItem[];
  selected: string[];
  onToggle: (id: string) => void;
}

/* ---------- nodo ---------- */
type Node = { name: string; file?: FileItem; children?: Node[] };

/* ---------- build tree (igual que antes) ---------- */
const buildTree = (items: FileItem[]): Node[] => {
  const root: Record<string, any> = {};
  for (const f of items) {
    const parts = f.path.split("/");
    let cur = root;
    parts.forEach((p, i) => {
      cur[p] ??= { name: p };
      if (i === parts.length - 1) cur[p].file = f;
      else cur[p].children ??= {};
      cur = cur[p].children ?? {};
    });
  }
  const toArr = (map: Record<string, any>): Node[] =>
    Object.values(map).map((n) =>
      n.children ? { ...n, children: toArr(n.children) } : n
    );
  return toArr(root);
};

/* ---------- icon helper ---------- */
const fileIcon = (name: string) => {
  if (/\.(docx?)$/i.test(name)) return <SiMicrosoftWord className="ft-icon doc" />;
  if (/\.(xlsx?)$/i.test(name)) return <SiMicrosoftExcel className="ft-icon xls" />;
  return <FiFileText className="ft-icon" />;
};


/* ---------- recursive node component ---------- */
const NodeRow = ({
  node,
  selected,
  onToggle,
}: {
  node: Node;
  selected: string[];
  onToggle: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);

  /* carpeta */
  if (node.children) {
    return (
      <li>
        <div
          className="ft-row folder"
          role="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <FiChevronDown /> : <FiChevronRight />}
          {open ? <FiFolder className="ft-icon" /> : <FiFolder className="ft-icon" />}
          <span className="ft-name">{node.name}</span>
        </div>
        <ul className={`ft-children ${open ? "open" : ""}`}>
          {node.children.map((ch) => (
            <NodeRow
              key={ch.name + (ch.file?.id ?? "")}
              node={ch}
              selected={selected}
              onToggle={onToggle}
            />
          ))}
        </ul>
      </li>
    );
  }

  /* archivo */
  if (node.file) {
    const { file } = node;
    const isSel = selected.includes(file.id);
    return (
      <li>
        <label
          className={`ft-row file ${isSel ? "sel" : ""}`}
          title={file.name}
        >
          {fileIcon(file.name)}
          <input
            type="checkbox"
            checked={isSel}
            onChange={() => onToggle(file.id)}
          />
          <span className="ft-name">{file.name}</span>
        </label>
      </li>
    );
  }
  return null;
};

/* ---------- main component ---------- */
export default function TreeFileList({ files, selected, onToggle }: Props) {
  if (!files.length)
    return <p className="file-list-empty">No hay archivos.</p>;

  const tree = buildTree(files);
  return (
    <ul className="ft-root" role="tree">
      {tree.map((n) => (
        <NodeRow
          key={n.name}
          node={n}
          selected={selected}
          onToggle={onToggle}
        />
      ))}
    </ul>
  );
}
