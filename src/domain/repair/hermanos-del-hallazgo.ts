import { CLASE, cita, CORREA, quedan, SEDE } from './hermanos-del-hallazgo-texto'
import { distancia, esMismaSede } from './sede-del-hallazgo'
import type { Candidate } from './select-target'

/** Lo minimo de otro hallazgo abierto para situarlo respecto a este. */
export interface Hermano {
  readonly id: string
  readonly tipo: string | null
  readonly file: string
  readonly line: number | null
  readonly title: string
  /** El bloque donde vive, tal cual lo guarda la fila. Decide la sede. */
  readonly simbolo: string | null
  /** A igual distancia va antes el mas antiguo. */
  readonly firstSeen: string
}

/** Cuantos se citan en total. Mas que esto deja de ser contexto y empieza a ser ruido. */
const MAX = 5

/** El mas cercano por linea primero; a igual distancia el mas antiguo; luego el
 *  id, para que dos corridas sobre los mismos datos digan lo mismo. */
const porCercania = (t: Candidate) => (a: Hermano, b: Hermano): number =>
  distancia(t, a) - distancia(t, b) || a.firstSeen.localeCompare(b.firstSeen) || a.id.localeCompare(b.id) // prettier-ignore

interface Seleccion {
  readonly sede: readonly Hermano[]
  readonly clase: readonly Hermano[]
  readonly citaSede: readonly Hermano[]
  readonly citaClase: readonly Hermano[]
}

/**
 * Los OTROS hallazgos abiertos del proyecto relacionados con este, en dos
 * bloques y en este orden (ADR-099): la MISMA SEDE —mismo fichero y simbolo, o
 * a pocas lineas—, sin mirar el tipo, candidatos a ser el MISMO defecto; y la
 * MISMA CLASE en otra sede, dicha como lo que es. `otro` no es una clase. Se
 * citan MAX en total, la sede primero y el mas cercano antes.
 */
function seleccionar(t: Candidate, abiertos: readonly Hermano[]): Seleccion {
  const otros = abiertos.filter((h) => h.id !== t.id)
  const sede = otros.filter((h) => esMismaSede(t, h)).sort(porCercania(t))
  const deClase = t.tipo === null || t.tipo === 'otro' ? [] : otros.filter((h) => h.tipo === t.tipo && !esMismaSede(t, h)) // prettier-ignore
  const clase = [...deClase.filter((h) => h.file === t.file), ...deClase.filter((h) => h.file !== t.file)] // prettier-ignore
  const citaSede = sede.slice(0, MAX)
  return { sede, clase, citaSede, citaClase: clase.slice(0, MAX - citaSede.length) }
}

/** El bloque para el analista: contexto para el juicio, no una decision; el
 *  fix sale del ancla propia (ADR-012), y se le dice. */
export function hermanosDelHallazgo(t: Candidate, abiertos: readonly Hermano[]): string | null {
  const s = seleccionar(t, abiertos)
  if (s.sede.length === 0 && s.clase.length === 0) return null
  return [
    ...(s.sede.length === 0 ? [] : [SEDE(s.sede.length), ...s.citaSede.map(cita), ...quedan(s.sede, s.citaSede, 'sede')]), // prettier-ignore
    ...(s.clase.length === 0 ? [] : [CLASE(s.clase.length, t.tipo), ...s.citaClase.map(cita), ...quedan(s.clase, s.citaClase, 'clase')]), // prettier-ignore
    CORREA
  ].join('\n')
}

/** A quien se cito, en el orden de la cita: los UNICOS ids que el analista
 *  puede nombrar en "mismoDefectoQue" (ADR-101 §3, fail-closed). */
export function hermanosCitados(t: Candidate, abiertos: readonly Hermano[]): readonly string[] {
  const s = seleccionar(t, abiertos)
  return [...s.citaSede, ...s.citaClase].map((h) => h.id)
}
