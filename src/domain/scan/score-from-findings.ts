import { scoreWithPenalties } from '../shared/penalty-score'
import type { HasSeverity, Severity } from '../shared/severity'

/**
 * Pesos del escaner interno: deliberadamente duros con lo explotable (cuatro
 * CRITICAL bastan para dejar el score en cero). El techo con un CRITICAL abierto
 * lo pone el scorer compartido, dentro de la banda "riesgo" a proposito.
 */
const PENALTY: Readonly<Record<Severity, number>> = {
  CRITICAL: 25,
  HIGH: 8,
  MEDIUM: 3,
  LOW: 1
}

/**
 * El score se calcula aqui, no lo decide el modelo: los mismos hallazgos tienen
 * que dar siempre el mismo numero, o comparar dos escaneos no significa nada.
 */
export function scoreFromFindings(findings: readonly HasSeverity[]): number {
  return scoreWithPenalties(findings, PENALTY)
}
