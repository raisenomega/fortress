/** Lo que hace falta para decir si dos hallazgos viven en el mismo sitio. */
export interface Sitio {
  readonly file: string
  readonly line: number | null
  readonly simbolo: string | null
}

/** A cuantas lineas oscila el escaner entre corridas: 62 de 62 gemelas del paso
 *  A del backfill cayeron a 3 o menos, 52 en la linea exacta (ADR-099 §2). */
export const CERCA = 3

/** El simbolo se compara normalizado: la fila lo guarda tal cual lo escribio el
 *  escaner (`Handler`, `Deno.serve`), y una mayuscula no es otra sede. */
const simbolo = (s: string | null): string | null => {
  const n = (s ?? '').trim().toLowerCase()
  return n === '' ? null : n
}

/** Lineas entre dos sitios; infinita si a alguno le falta la linea. */
export function distancia(a: Sitio, b: Sitio): number {
  if (a.line === null || b.line === null) return Number.POSITIVE_INFINITY
  return Math.abs(a.line - b.line)
}

/**
 * La MISMA SEDE (ADR-099 §2): mismo fichero y mismo simbolo, sin mirar el tipo.
 * Si a alguno de los dos le falta el simbolo, decide la distancia: mismo
 * fichero a CERCA lineas o menos. Es la senal barata de «candidato a ser el
 * mismo defecto»; juzgar si lo es sigue siendo del analista.
 */
export function esMismaSede(a: Sitio, b: Sitio): boolean {
  if (a.file !== b.file) return false
  const sa = simbolo(a.simbolo),
    sb = simbolo(b.simbolo)
  if (sa !== null && sb !== null) return sa === sb
  return distancia(a, b) <= CERCA
}
