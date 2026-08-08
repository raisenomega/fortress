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
  const { score } = await auditor.audit(project.path, project.trusted, security)

  context.projects.setQuality(projectId, score.global, dimensionScoresOf(score), score.partial)
  return ok(score)
}
