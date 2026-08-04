import { OFFICIAL_AT } from './capability'

/** Evidencia real de los episodios; nada de esto se auto-asigna. */
export interface MaturityEvidence {
  readonly episodes: number
  readonly failures: number
  /** Cumplimiento medio de las reglas (0..1), de las ejecuciones reales. */
  readonly complianceRate: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Puntaje de madurez (0..50.000) DERIVADO de evidencia real: los episodios
 * descontados por su calidad (fallos y cumplimiento). El sistema no se pone su
 * propia nota; el numero sale de lo que de verdad paso, y por eso no puede mentir.
 */
export function computeMaturity(evidence: MaturityEvidence): number {
  const { episodes, failures, complianceRate } = evidence
  if (episodes <= 0) return 0
  const failureRate = clamp(failures / episodes, 0, 1)
  const quality = clamp(complianceRate, 0, 1) * (1 - failureRate)
  return Math.round(clamp(episodes * quality, 0, OFFICIAL_AT))
}
