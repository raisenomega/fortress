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

const donde = (h: Hermano): string => (h.line === null ? h.file : `${h.file}:${h.line}`)
const cita = (h: Hermano): string => `${donde(h)} — ${h.title}`
const quedan = (todos: readonly Hermano[], citados: readonly Hermano[], de: string): string[] =>
  todos.length > citados.length ? [`(y ${todos.length - citados.length} mas de la ${de})`] : []

/** El mas cercano por linea primero; a igual distancia el mas antiguo; luego el
 *  id, para que dos corridas sobre los mismos datos digan lo mismo. */
const porCercania = (t: Candidate) => (a: Hermano, b: Hermano): number =>
  distancia(t, a) - distancia(t, b) || a.firstSeen.localeCompare(b.firstSeen) || a.id.localeCompare(b.id) // prettier-ignore

const SEDE = (n: number): string =>
  `Otros ${n} hallazgos abiertos en tu MISMA SEDE (mismo fichero y simbolo, o a pocas lineas): candidatos a ser el MISMO defecto. Si lo son, dilo en "notes".` // prettier-ignore
const CLASE = (n: number, tipo: string | null): string =>
  `Otros ${n} hallazgos abiertos de tu MISMA CLASE (${tipo}) en otras sedes: probablemente defectos distintos.` // prettier-ignore
const CORREA = 'NO los arregles ni los cites como where: la correa de este fix sale de su ancla.'

/**
 * Los OTROS hallazgos abiertos del proyecto relacionados con este, en dos
 * bloques y en este orden (ADR-099):
 *
 * 1. La MISMA SEDE —mismo fichero y simbolo, o a pocas lineas—, sin mirar el
 *    tipo: candidatos a ser el MISMO defecto. `send-invoice` tenia seis filas
 *    vivas para un defecto con cinco tipos distintos, y por clase no se veian.
 * 2. La MISMA CLASE en otra sede, dicha como lo que es: probablemente defectos
 *    distintos. El 97 % de las citas por clase caian en otro fichero.
 *
 * `otro` no es una clase: no agrupa por clase, pero si entra en la sede. Se
 * citan MAX en total, la sede primero y el mas cercano antes. Es contexto para
 * el juicio, no una decision: el fix sale del ancla propia (ADR-012), y se le dice.
 */
export function hermanosDelHallazgo(t: Candidate, abiertos: readonly Hermano[]): string | null {
  const otros = abiertos.filter((h) => h.id !== t.id)
  const sede = otros.filter((h) => esMismaSede(t, h)).sort(porCercania(t))
  const deClase = t.tipo === null || t.tipo === 'otro' ? [] : otros.filter((h) => h.tipo === t.tipo && !esMismaSede(t, h)) // prettier-ignore
  const clase = [...deClase.filter((h) => h.file === t.file), ...deClase.filter((h) => h.file !== t.file)] // prettier-ignore
  if (sede.length === 0 && clase.length === 0) return null
  const citaSede = sede.slice(0, MAX),
    citaClase = clase.slice(0, MAX - citaSede.length)
  return [
    ...(sede.length === 0 ? [] : [SEDE(sede.length), ...citaSede.map(cita), ...quedan(sede, citaSede, 'sede')]), // prettier-ignore
    ...(clase.length === 0 ? [] : [CLASE(clase.length, t.tipo), ...citaClase.map(cita), ...quedan(clase, citaClase, 'clase')]), // prettier-ignore
    CORREA
  ].join('\n')
}
