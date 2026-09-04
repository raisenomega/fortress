import type { Analyst, AnalystResult } from '@domain/repair/analysis'
import type { Selection } from '@domain/repair/select-target'

/**
 * C2 — ANALISIS: FORTRESS ESTUDIA (grafo-primero) el hallazgo elegido para entender
 * el contexto y el patron guardRun. NO genera fix ni toca archivos: delega en el
 * analista (infra) y devuelve el entendimiento INERTE junto con su factura (runMeta).
 *
 * `atendidas` es la memoria: lo que FORTRESS ya trato, para que el analista no lo
 * vuelva a observar. Pasa de largo, ya formateada — aqui no se decide nada sobre
 * ella; se decide en quien tiene la base, que es quien llama.
 */
export async function analyzeTarget(
  analyst: Analyst,
  selection: Selection,
  atendidas: readonly string[]
): Promise<AnalystResult> {
  return analyst.study(selection.target, atendidas)
}
