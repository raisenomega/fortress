import { normalizeScore } from '../project/fortress-score'
import type { Severity } from '../shared/severity'
import type { PostureFinding } from './posture-finding'

const PENALTY: Readonly<Record<Severity, number>> = {
  CRITICAL: 25,
  HIGH: 10,
  MEDIUM: 4,
  LOW: 1
}

const CRITICAL_CEILING = 64

/**
 * Score de exposicion, misma logica que el interno: determinista y con techo
 * si hay algo CRITICAL. Un .env expuesto no puede dar un numero en verde por
 * mucho que el resto este bien.
 */
export function postureScore(findings: readonly PostureFinding[]): number {
  const penalty = findings.reduce((total, f) => total + PENALTY[f.severity], 0)
  const score = normalizeScore(100 - penalty)

  const hasCritical = findings.some((f) => f.severity === 'CRITICAL')
  return hasCritical ? Math.min(score, CRITICAL_CEILING) : score
}
