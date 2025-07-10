/**
 * Arregla tablas que llegan con cada celda en una línea separada:
 *
 * | Col1
 * | Col2
 * ...
 * |-----   (línea de guiones)
 *
 * Devuelve una tabla GFM estándar
 * | Col1 | Col2 |
 * |------|------|
 * | ...  | ...  |
 */
export function fixBrokenTables(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];

  let buffer: string[] = [];
  let columnCount = 0;
  let inBrokenTable = false;

  const flushRow = () => {
    if (!buffer.length) return;
    out.push("| " + buffer.join(" | ") + " |");
    buffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trimEnd();

    // 1) header separator (---) - produce la línea separadora GFM
    if (/^\|[-\s]+$/.test(l)) {
      inBrokenTable = true;
      columnCount = buffer.length;          // nº de celdas en header
      flushRow();                           // header en una sola línea
      out.push("|" + " --- |".repeat(columnCount)); // ----- line
      continue;                             // skip original dashed line
    }

    // 2) líneas de celda sueltas ("| Texto")
    if (/^\|/.test(l) && !/^\|[-\s]+$/.test(l)) {
      inBrokenTable = true;
      buffer.push(l.replace(/^\|\s?/, "").trim());
      // Si ya tenemos columna completa (posterior a header)
      if (columnCount && buffer.length === columnCount) flushRow();
      continue; // no guardar la línea original
    }

    // 3) línea fuera de tabla
    flushRow();
    inBrokenTable = false;
    out.push(l);
  }

  flushRow();
  return out.join("\n");
}
