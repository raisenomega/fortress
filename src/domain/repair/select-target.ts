import { isAdditive } from './additive'
import type { Severity } from '../shared/severity'

/** Subconjunto puro de un hallazgo, suficiente para ELEGIR cual reparar. */
export interface Candidate {
  readonly id: string
  readonly severity: Severity
  readonly title: string
  readonly file: string
  readonly line: number | null
}

export interface Selection {
  readonly target: Candidate
  /** Justificacion trazable: que, por que ese, y por que es seguro estrenar. */
  readonly reason: string
}

/**
 * Severidades que el motor puede tocar en modo ESTRENO.
 *
 * Empezo en solo-LOW. Subio a MEDIUM el 2026-08-08, despues de que el motor
 * completara una ejecucion auditada de punta a punta sobre un LOW
 * (claude-account): eligio por superficie, VERIFICO antes de proponer —
 * atrapando un hallazgo obsoleto— y paso por worktree + gate + OMEGA + firma
 * humana. HIGH y CRITICAL siguen fuera: piden mas confianza acumulada.
 *
 * Ampliar el estreno NO relaja ninguna red: el elegido sigue pasando por las
 * tres zonas y la firma. Solo cambia sobre que puede trabajar el motor.
 */
const DEBUT: readonly Severity[] = ['LOW', 'MEDIUM']

/** true si el hallazgo cae en el terreno que el motor tiene permitido estrenar. */
export function isDebutEligible(c: Candidate): boolean {
  return DEBUT.includes(c.severity)
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

/** Orden total DETERMINISTA: menor superficie; empata por archivo, linea, id. */
function order(a: Candidate, b: Candidate): number {
  return (
    surface(a) - surface(b) ||
    a.file.localeCompare(b.file) ||
    (a.line ?? 0) - (b.line ?? 0) ||
    a.id.localeCompare(b.id)
  )
}

/**
 * C1 — SELECCION: elige de forma DETERMINISTA que hallazgo elegible atacar. NO
 * genera fix ni toca codigo: solo devuelve el elegido y su justificacion (o null
 * si no hay elegibles). Puro: mismo input, en cualquier orden, mismo elegido.
 */
export function selectTarget(candidates: readonly Candidate[]): Selection | null {
  const eligible = candidates.filter(isDebutEligible)
  if (eligible.length === 0) return null
  const target = [...eligible].sort(order)[0]
  const reason =
    `${target.title} (${target.file}:${target.line}, ${target.severity}). Elegido: MENOR ` +
    `superficie (${surface(target)}) entre los elegibles (${DEBUT.join('/')}) — fix ADITIVO de ` +
    `un control ya establecido en el repo, no reescritura de logica. Contenido y verificable.`
  return { target, reason }
}
