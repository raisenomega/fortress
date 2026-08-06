import { normalizeScore } from '../project/fortress-score'
import type { HasSeverity, Severity } from './severity'

/** Con un CRITICAL abierto el score no puede pasar de aqui (banda "riesgo"). */
export const CRITICAL_CEILING = 64

/**
 * Score 0-100 determinista y con techo: cada hallazgo resta segun su severidad y
 * un CRITICAL abierto impone el techo. La TABLA de pesos la elige quien llama
 * —exposicion castiga mas duro que el escaner interno—, pero el algoritmo es uno
 * solo: antes vivia duplicado en dos archivos con pesos que divergieron en silencio.
 */
export function scoreWithPenalties(
  findings: readonly HasSeverity[],
  penalty: Readonly<Record<Severity, number>>
): number {
  const total = findings.reduce((sum, finding) => sum + penalty[finding.severity], 0)
  const score = normalizeScore(100 - total)
  const hasCritical = findings.some((finding) => finding.severity === 'CRITICAL')
  return hasCritical ? Math.min(score, CRITICAL_CEILING) : score
}
