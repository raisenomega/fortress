import type { OmegaEntry } from '../omega/omega-entry'
import type { Finding } from '../project/finding'
import type { FindingHistoria } from '../project/finding-historia'
import type { MarcoDelKit } from './bloque-cto-kit'
import { lineaDeHallazgo } from './hallazgos-del-marco'
import { cabeceraDeHallazgos, seleccionarHallazgos } from './seleccion-de-hallazgos'

/**
 * Los marcos del LIBRO DE VIDA del proyecto anclado (Sello B.1): dominio puro
 * que recibe FILAS ya leidas y las resume como texto. Minima no es corta, es
 * sin ruido: un tope por fuente y una linea por hecho. La fuente vacia produce
 * texto vacio y `bloqueCtoKit` la deja caer sola, sin cabecera huerfana.
 */
const TOPE = 20
/** Mas ancho que el resto: los graves nunca se recortan, el resto llega a ~40. */
const TOPE_HALLAZGOS = 40

export const marcoDeLineas = (nombre: string, lineas: readonly string[]): MarcoDelKit => ({
  nombre,
  texto: lineas.join('\n')
})

/** Los hallazgos SIN EXTINGUIR (ya ordenados por urgencia por la consulta
 *  anclada). Marca el estado —descartado/mitigado no es vivo-abierto— y nunca
 *  recorta un grave; la cabecera da el total real. El CTO los lee como DATO. */
export function marcoDeHallazgos(vivos: readonly Finding[]): MarcoDelKit {
  if (vivos.length === 0) return marcoDeLineas('hallazgos-vivos', [])
  const mostrados = seleccionarHallazgos(vivos, TOPE_HALLAZGOS)
  const cabeza = cabeceraDeHallazgos(vivos, mostrados.length)
  return marcoDeLineas('hallazgos-vivos', [cabeza, ...mostrados.map(lineaDeHallazgo)])
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
