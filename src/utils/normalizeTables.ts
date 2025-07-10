/**
 * Inserta un doble \n antes de cualquier fila que empiece con '|'
 *   …texto➡ | col1 | col2 | …     →     …texto➡ \n\n| col1 | col2 | …
 */
export function normalizeTables(md: string): string {
  return md.replace(/(^|[^\n])\|/g, (m, p1) => {
    // si ya hay \n justo antes, no hacemos nada
    return p1.endsWith("\n") ? m : `${p1}\n\n|`;
  });
}
