import { normalizeScore } from '../project/fortress-score'
import type { HasSeverity, Severity } from '../shared/severity'

/**
 * Cuanto resta cada hallazgo sobre 100. Los pesos son deliberadamente duros
 * con lo explotable: cuatro CRITICAL bastan para dejar el score en cero.
 */
const PENALTY: Readonly<Record<Severity, number>> = {
  CRITICAL: 25,
  HIGH: 8,
  MEDIUM: 3,
  LOW: 1
}

/**
 * Techo con un CRITICAL abierto. Cae dentro de la banda "riesgo" a proposito:
 * sin el, un repo con una sola SQL injection entre mucho codigo sano marcaria
 * 75/100 en verde y a la vez "push bloqueado", y esa contradiccion en pantalla
 * ensena al operador a desconfiar del semaforo.
 */
const CRITICAL_CEILING = 64

/**
 * El score se calcula aqui, no lo decide el modelo: los mismos hallazgos tienen
 * que dar siempre el mismo numero, o comparar dos escaneos no significa nada.
 */
export function scoreFromFindings(findings: readonly HasSeverity[]): number {
  const penalty = findings.reduce((total, finding) => total + PENALTY[finding.severity], 0)
  const score = normalizeScore(100 - penalty)

  const hasCritical = findings.some((finding) => finding.severity === 'CRITICAL')
  return hasCritical ? Math.min(score, CRITICAL_CEILING) : score
}
