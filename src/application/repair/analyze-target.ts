import type { Analyst, AnalystResult } from '@domain/repair/analysis'
import type { Selection } from '@domain/repair/select-target'

/**
 * C2 — ANALISIS: FORTRESS ESTUDIA (grafo-primero) el hallazgo elegido para entender
 * el contexto y el patron guardRun. NO genera fix ni toca archivos: delega en el
 * analista (infra) y devuelve el entendimiento INERTE junto con su factura (runMeta).
 */
export async function analyzeTarget(
  analyst: Analyst,
  selection: Selection
): Promise<AnalystResult> {
  return analyst.study(selection.target)
}
