import { auditHeadline, type OmegaAuditReport } from '@domain/omega/audit-report'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { verifyFindings } from './verify-findings'

/** Los hallazgos salen del escaneo, que corre siempre con el Security Reviewer. */
const SCANNER = 'security-reviewer'

/**
 * OMEGA verifica cada hallazgo abierto contra el filesystem real y deja cada
 * veredicto (con evidencia) + un resumen en el Libro de la Vida. Lo que no
 * cuadra con el disco es 'discrepancia'; la intencion nunca se juzga.
 */
export function auditProject(context: AppContext, projectId: string): Result<OmegaAuditReport> {
  const project = context.projects.findById(projectId)
  if (!project) return err('Ese proyecto ya no existe')

  const checks = verifyFindings(context, project)
  let discrepancias = 0

  for (const check of checks) {
    if (check.verdict === 'discrepancia') discrepancias += 1
    context.omegaLog.append({
      projectId,
      agentId: SCANNER,
      kind: 'verificacion',
      verdict: check.verdict,
      summary: check.summary,
      evidence: check.evidence
    })
  }

  context.omegaLog.append({
    projectId,
    agentId: 'sentinel-omega',
    kind: 'score',
    verdict: discrepancias > 0 ? 'discrepancia' : 'ok',
    summary: auditHeadline(checks.length, discrepancias),
    evidence: `${checks.length} hallazgos verificados`
  })

  return ok({ verified: checks.length, discrepancies: discrepancias })
}
