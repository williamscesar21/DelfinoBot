/**
 * Recibe un array de líneas SSE ("data: …") y devuelve
 * el contenido concatenado listo para Markdown.
 *
 * Ejemplo de entrada:
 *   ["data:Hola", "data:| Concepto | Precio |", "data:|---|---|"]
 *
 * Salida:
 *   "Hola\n| Concepto | Precio |\n|---|---|"
 */
export function reassembleStream(lines: string[]): string {
  return lines
    .filter(l => l.startsWith("data:"))        // solo las líneas data:
    .map(l => l.replace(/^data:\s?/, ""))      // quita el prefijo "data:"
    .join("")                                  // une las piezas (así llegan fragmentadas)
    .replace(/ +\n/g, "\n")                    // limpia espacios antes de \n
    .replace(/\n{3,}/g, "\n\n");               // colapsa saltos múltiples
}
