import { auditHeadline, type OmegaAuditReport } from '@domain/omega/audit-report'
import { checkFinding } from '@domain/omega/finding-check'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/** Los hallazgos salen del escaneo, que corre siempre con el Security Reviewer. */
const SCANNER = 'security-reviewer'

/**
 * OMEGA verifica cada hallazgo abierto contra el filesystem real: comprueba que
 * el archivo:linea reportado EXISTE. Lo que no cuadra es 'discrepancia', con
 * evidencia. Cada verificacion y el resumen quedan en el Libro de la Vida.
 */
export function auditProject(context: AppContext, projectId: string): Result<OmegaAuditReport> {
  const project = context.projects.findById(projectId)
  if (!project) return err('Ese proyecto ya no existe')

  const abiertos = context.findings.listByProject(projectId).filter((f) => f.status === 'open')
  let discrepancias = 0

  for (const finding of abiertos) {
    const check = checkFinding(finding, context.filesystemProbe.probe(project.path, finding.file))
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
    summary: auditHeadline(abiertos.length, discrepancias),
    evidence: `${abiertos.length} hallazgos verificados`
  })

  return ok({ verified: abiertos.length, discrepancies: discrepancias })
}
