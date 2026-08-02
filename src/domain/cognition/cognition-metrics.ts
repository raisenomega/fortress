import type { CognitionPattern, PatternStatus } from './cognition-log'

export type PatternCounts = Readonly<Record<PatternStatus, number>>

export const NO_PATTERNS: PatternCounts = { ACTIVE: 0, MITIGATED: 0, EXTINTO: 0 }

/**
 * Los conteos salen de los patrones registrados, no de la cabecera del log.
 * La cabecera la escribe a mano quien cierra la sesion y puede quedarse
 * desfasada; los registros son el hecho.
 */
export function countPatterns(patterns: readonly CognitionPattern[]): PatternCounts {
  const counts: Record<PatternStatus, number> = { ...NO_PATTERNS }
  for (const pattern of patterns) counts[pattern.status] += 1
  return counts
}

/**
 * Proporcion de patrones extintos, o null si no hay ninguno registrado. Null
 * y no cero: sin patrones no es que la tasa sea mala, es que no existe.
 */
export function extinctionRate(counts: PatternCounts): number | null {
  const total = counts.ACTIVE + counts.MITIGATED + counts.EXTINTO
  return total === 0 ? null : counts.EXTINTO / total
}

/** Cuantas veces han reaparecido patrones ya detectados. */
export function totalRecurrences(patterns: readonly CognitionPattern[]): number {
  return patterns.reduce((total, pattern) => total + Math.max(0, (pattern.recurrences ?? 1) - 1), 0)
}
