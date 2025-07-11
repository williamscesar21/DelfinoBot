/**
 * Convierte “tablas rotas” (cada celda en una línea) en tablas Markdown GFM estándar.
 *
 * De:
 * | Col1
 * | Col2
 * |-----
 *
 * A:
 * | Col1 | Col2 |
 * |------|------|
 * | …    | …    |
 */
export function fixBrokenTables(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];

  let buffer: string[] = [];
  let columnCount = 0;

  const flushRow = () => {
    if (!buffer.length) return;
    out.push(`| ${buffer.join(" | ")} |`);
    buffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trimEnd();

    // 1) Separador de cabecera (“|-----”) → línea de separadores GFM
    if (/^\|[-\s]+$/.test(l)) {
      columnCount = buffer.length;        // nº celdas en la cabecera
      flushRow();                         // cabecera en una sola línea
      out.push("|" + " --- |".repeat(columnCount)); // línea de guiones
      continue;                           // descarta la original
    }

    // 2) Celdas sueltas (“| Texto”)
    if (/^\|/.test(l) && !/^\|[-\s]+$/.test(l)) {
      buffer.push(l.replace(/^\|\s?/, "").trim());
      if (columnCount && buffer.length === columnCount) flushRow(); // fila completa
      continue;                           // descarta la original
    }

    // 3) Línea fuera de tabla
    flushRow();
    out.push(l);
  }

  flushRow();
  return out.join("\n");
}
