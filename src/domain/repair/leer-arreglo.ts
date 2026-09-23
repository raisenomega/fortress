/**
 * Donde VA el cambio principal, dicho por el analista (ADR-102 §2). Es distinto
 * del ancla —donde se DETECTO el defecto— y por eso viaja aparte: un defecto en
 * `application` cuya regla de capas manda arreglarlo en `infrastructure` tiene
 * dos sitios, y hasta ahora solo el primero era legible por una maquina.
 */
export interface Arreglo {
  readonly file: string
  readonly line: number | null
}

/**
 * Se lee sin fiarse de la forma: un objeto con `file` cadena no vacia y `line`
 * entero o null. Cualquier otra cosa es «no dijo», y «no dijo» se genera como
 * hoy (casilla 1 de ADR-102): el guard es un freno de gasto, no una defensa, y
 * el veto de correa sigue detras del diff.
 */
export function leerArreglo(bruto: unknown): Arreglo | undefined {
  if (typeof bruto !== 'object' || bruto === null || Array.isArray(bruto)) return undefined
  const { file, line } = bruto as { file?: unknown; line?: unknown }
  if (typeof file !== 'string' || file.trim() === '') return undefined
  if (line !== null && !(typeof line === 'number' && Number.isInteger(line))) return undefined
  return { file: file.trim(), line }
}
