import type { Project } from '@domain/project/project'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import { scoreFromFindings } from '@domain/scan/score-from-findings'
import type { AppContext } from '../context'

/**
 * Persiste la CALIDAD GENERAL del proyecto tras una auditoria integral (todas las
 * dimensiones, no solo seguridad). Distinta del score de seguridad (`updateScan`):
 * la tarjeta muestra ambas. Una CRITICAL de seguridad la tope (ver scoreFromFindings).
 * El desglose por dimension vive en el informe del workflow (alli hay agentId).
 */
export function persistQuality(
  context: AppContext,
  project: Project,
  findings: readonly DetectedFinding[]
): number {
  const score = scoreFromFindings(findings)
  context.projects.setGeneralQuality(project.id, score)
  return score
}
