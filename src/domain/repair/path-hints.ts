/** Token con pinta de path de codigo: extension conocida, sin espacios. */
const CANDIDATE = /[\w@./-]+\.(?:tsx?|jsx?|json|md)\b/g

/**
 * Extrae los paths embebidos en la prosa del `where` de C2. El analista escribe
 * parrafos ricos (buen analisis) y los paths van dentro de la oracion: aqui se
 * pescan como CANDIDATOS — la cordura de directorio la aplica el consumidor.
 */
export function extractPathHints(prose: string): string[] {
  return [...new Set(prose.match(CANDIDATE) ?? [])]
}
