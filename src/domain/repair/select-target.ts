import { isAdditive } from './additive'
import { DEBUT, isDebutEligible } from './debut'
import type { Severity } from '../shared/severity'
import { cargaPorDirectorio, directorio } from './orden-candidatos'

/** Subconjunto puro de un hallazgo, suficiente para ELEGIR cual reparar. */
export interface Candidate {
  readonly id: string
  readonly severity: Severity
  readonly title: string
  readonly file: string
  readonly line: number | null
  /** Cuando se vio por primera vez. Es lo que hace que quien espera suba. */
  readonly firstSeen: string
}

export interface Selection {
  readonly target: Candidate
  /** Justificacion trazable: que, por que ese, y por que es seguro estrenar. */
  readonly reason: string
}

/** Cuantos controles debe agregar el fix (cada "ni" suma uno). */
function concerns(title: string): number {
  return 1 + (title.match(/\bni\b/gi)?.length ?? 0)
}

/** Superficie de cambio estimada: menor = mas contenido = mas seguro de estrenar.
 *  Aditivo (agregar un control conocido) << reescribir logica de validacion. */
export function surface(c: Candidate): number {
  return (isAdditive(c.title) ? 0 : 10) + concerns(c.title)
}

/** Orden total DETERMINISTA: menor superficie; luego el mas viejo; luego el de
 *  la carpeta menos cargada; y linea e id para cerrar el orden. */
function order(carga: ReadonlyMap<string, number>) {
  const pendientes = (c: Candidate): number => carga.get(directorio(c.file)) ?? 0
  return (a: Candidate, b: Candidate): number =>
    surface(a) - surface(b) ||
    a.firstSeen.localeCompare(b.firstSeen) ||
    pendientes(a) - pendientes(b) ||
    directorio(a.file).localeCompare(directorio(b.file)) ||
    (a.line ?? 0) - (b.line ?? 0) ||
    a.id.localeCompare(b.id)
}

/**
 * C1 — SELECCION: elige de forma DETERMINISTA que hallazgo elegible atacar. NO
 * genera fix ni toca codigo: solo devuelve el elegido y su justificacion (o null
 * si no hay elegibles). Puro: mismo input, en cualquier orden, mismo elegido.
 */
export function selectTarget(candidates: readonly Candidate[]): Selection | null {
  const eligible = candidates.filter(isDebutEligible)
  if (eligible.length === 0) return null
  // La carga se cuenta sobre los candidatos PRESENTES, no sobre historial: el
  // selector sigue siendo una funcion pura de su entrada, y la cuenta cambia
  // sola conforme el pozo se vacia.
  const target = [...eligible].sort(order(cargaPorDirectorio(eligible)))[0]
  const reason =
    `${target.title} (${target.file}:${target.line}, ${target.severity}). Elegido: MENOR ` +
    `superficie (${surface(target)}) entre los elegibles (${DEBUT.join('/')}), y el mas antiguo ` +
    `sin atender (${target.firstSeen}), de la carpeta menos cargada. Contenido y verificable.`
  return { target, reason }
}
