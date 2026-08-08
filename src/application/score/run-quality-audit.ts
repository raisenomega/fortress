import { CONTAMINATED_MSG, forensic } from '@domain/probe/contamination'
import { dimensionScoresOf } from '@domain/score/dimension-scores'
import type { IntegralScore } from '@domain/score/integral-score'
import type { QualityAuditor } from '@domain/score/quality-auditor'
import { isOpen } from '@domain/project/finding-status'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/**
 * Audita las 6 dimensiones y persiste el score integral. Seguridad REUSA los
 * hallazgos abiertos del ultimo escaneo; los 5 probes solo corren si el proyecto
 * es de CONFIANZA (si no, esas dimensiones quedan SIN DATOS -> global PARCIAL).
 */
export async function runQualityAudit(
  context: AppContext,
  auditor: QualityAuditor,
  projectId: string
): Promise<Result<IntegralScore>> {
  const project = context.projects.findById(projectId)
  if (!project) return err('El proyecto ya no existe')

  const security = context.findings
    .listByProject(projectId)
    .filter((finding) => isOpen(finding.status))
  const { score, integrity } = await auditor.audit(project.path, project.trusted, security)

  // CAPA 4 — circuit breaker: si el audit no dejo el proyecto byte-identico, NO se
  // persiste el score (esta contaminado); se marca y se bloquea para el humano.
  if (!integrity.clean) {
    const detail = forensic(integrity.violations)
    context.projects.markContaminated(projectId, detail)
    return err(`${CONTAMINATED_MSG} ${detail}`)
  }

  context.projects.setQuality(projectId, score.global, dimensionScoresOf(score), score.partial)
  return ok(score)
}
