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

/** En modo ESTRENO solo se consideran hallazgos LOW (terreno seguro). */
const DEBUT: Severity = 'LOW'

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
 * C1 — SELECCION: elige de forma DETERMINISTA que hallazgo LOW atacar. NO genera
 * fix ni toca codigo: solo devuelve el elegido y su justificacion (o null si no
 * hay LOW abiertos). Puro: mismo input, en cualquier orden, mismo elegido.
 */
export function selectTarget(candidates: readonly Candidate[]): Selection | null {
  const lows = candidates.filter((c) => c.severity === DEBUT)
  if (lows.length === 0) return null
  const target = [...lows].sort(order)[0]
  const reason =
    `${target.title} (${target.file}:${target.line}, ${target.severity}). Elegido: MENOR ` +
    `superficie (${surface(target)}) entre los LOW — fix ADITIVO de un control ya establecido ` +
    `en el repo, no reescritura de logica. Seguro para estrenar: LOW, contenido, patron probado.`
  return { target, reason }
}
