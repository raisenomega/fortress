import { scoreWithPenalties } from '../shared/penalty-score'
import type { Severity } from '../shared/severity'
import type { PostureFinding } from './posture-finding'

/**
 * La exposicion castiga MAS duro que el escaner interno (HIGH 10 vs 8, MEDIUM
 * 4 vs 3) a proposito: un fallo publico y accesible pesa mas que el mismo en el
 * codigo. Mismo algoritmo (scoreWithPenalties), distinta tabla, y explicito.
 */
const PENALTY: Readonly<Record<Severity, number>> = {
  CRITICAL: 25,
  HIGH: 10,
  MEDIUM: 4,
  LOW: 1
}

/** Un .env expuesto no puede dar verde por mucho que el resto este bien. */
export function postureScore(findings: readonly PostureFinding[]): number {
  return scoreWithPenalties(findings, PENALTY)
}
