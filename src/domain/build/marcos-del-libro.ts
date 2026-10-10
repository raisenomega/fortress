import type { OmegaEntry } from '../omega/omega-entry'
import type { Finding } from '../project/finding'
import type { FindingHistoria } from '../project/finding-historia'
import type { MarcoDelKit } from './bloque-cto-kit'

/**
 * Los marcos del LIBRO DE VIDA del proyecto anclado (Sello B.1): dominio puro
 * que recibe FILAS ya leidas y las resume como texto. Minima no es corta, es
 * sin ruido: un tope por fuente y una linea por hecho. La fuente vacia produce
 * texto vacio y `bloqueCtoKit` la deja caer sola, sin cabecera huerfana.
 */
const TOPE = 20

export const marcoDeLineas = (nombre: string, lineas: readonly string[]): MarcoDelKit => ({
  nombre,
  texto: lineas.join('\n')
})

/** Los hallazgos VIVOS, ya ordenados por urgencia por la consulta anclada. */
export function marcoDeHallazgos(vivos: readonly Finding[]): MarcoDelKit {
  const lineas = vivos
    .slice(0, TOPE)
    .map((f) => `${f.severity} · ${f.file}:${f.line ?? '?'} · ${f.title}`)
  const cabeza = lineas.length === 0 ? [] : [`${vivos.length} vivos (muestra de ${lineas.length}):`]
  return marcoDeLineas('hallazgos-vivos', [...cabeza, ...lineas])
}

/** Lo CERRADO y de que murio cada uno (la historia, ADR-087). */
export function marcoDeHistoria(cerrados: readonly FindingHistoria[]): MarcoDelKit {
  const lineas = cerrados
    .slice(0, TOPE)
    .map((f) => `${f.severity} · ${f.title} · ${f.extinctReason ?? 'sin motivo'}`)
  return marcoDeLineas('historia-reciente', lineas)
}

/** Los asientos de OMEGA: el registro eterno, una linea por juicio. */
export function marcoDelLibroDeVida(asientos: readonly OmegaEntry[]): MarcoDelKit {
  const lineas = asientos.map((a) => `${a.at} · ${a.kind} · ${a.verdict} · ${a.summary}`)
  return marcoDeLineas('libro-de-la-vida', lineas)
}
