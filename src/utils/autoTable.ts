/**
 * Convierte una línea compacta con muchas tuberías en
 * una tabla GitHub-Flavored Markdown (GFM) correcta.
 * Además descarta filas residuales que sólo contienen guiones.
 */
export function autoTable(md: string): string {
  return md.replace(
    /(?:^|\n).*?\|[^|\n]+\|[^|\n]+\|[^|\n]+[^\n]*/g,
    (raw) => {
      const prefix  = raw.slice(0, raw.indexOf("|"));
      const part    = raw.slice(raw.indexOf("|"));            // “| …”
      const cells   = part.split("|").map(c => c.trim()).filter(Boolean);

      if (cells.length < 3) return raw;                       // no parece tabla

      // Detectamos cuántas columnas tiene la cabecera
      let colCount = cells.findIndex(c => /^-+$/.test(c));
      if (colCount === -1) colCount = cells.length;           // sin separador explícito

      const rows: string[] = [];
      for (let i = 0; i < cells.length; i += colCount) {
        rows.push("| " + cells.slice(i, i + colCount).join(" | ") + " |");
      }

      // Garantizamos fila separadora (fila 1)
      if (!/^(\|\s*-+\s*)+\|$/.test(rows[1] ?? "")) {
        const sep = "| " + Array(colCount).fill("---").join(" | ") + " |";
        rows.splice(1, 0, sep);
      }

      /* ── FILTRO EXTRA ──
       * Descarta cualquier otra fila compuesta sólo de guiones
       */
      const finalRows = rows.filter(
        (r, idx) => idx <= 1 || !/^(\|\s*-+\s*)+\|$/.test(r)
      );

      return `${prefix}\n${finalRows.join("\n")}`;
    }
  );
}
