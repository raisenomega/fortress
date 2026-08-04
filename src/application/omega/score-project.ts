import { computeScore, type OmegaScore } from '@domain/omega/omega-score'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { verifyFindings } from './verify-findings'

const SCANNER = 'security-reviewer'

/**
 * Puntuacion de integridad de OMEGA. Solo con datos reales: veracidad (hallazgos
 * que cuadran con el disco) y cumplimiento (ejecuciones sin fallo). Los tokens
 * por hallazgo van como dato informativo, no puntuado: sin base de flota, un
 * umbral seria arbitrario y OMEGA no finge precision que no tiene.
 */
export function scoreProject(context: AppContext, projectId: string): Result<OmegaScore> {
  const project = context.projects.findById(projectId)
  if (!project) return err('Ese proyecto ya no existe')

  const checks = verifyFindings(context, project)
  const totals = context.runs.totalsFor(SCANNER, projectId)

  return ok(
    computeScore({
      okChecks: checks.filter((c) => c.verdict === 'ok').length,
      discrepancies: checks.filter((c) => c.verdict === 'discrepancia').length,
      runs: totals.runs,
      failedRuns: totals.failed,
      outputTokens: totals.usage.outputTokens,
      verifiedFindings: checks.length
    })
  )
}
