import type { OmegaEntry } from '@domain/omega/omega-entry'
import { auditSummary } from '@domain/omega/omega-summary'
import { countFindings } from '@domain/project/severity-counts'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/**
 * OMEGA audita el estado actual del proyecto y lo deja escrito en el Libro de la
 * Vida (append-only, eterno). Fase 2: registra los hallazgos abiertos como
 * asiento forense. La Fase 3 anadira la verificacion contra el filesystem.
 */
export function auditProject(context: AppContext, projectId: string): Result<OmegaEntry> {
  const project = context.projects.findById(projectId)
  if (!project) return err('Ese proyecto ya no existe')

  const abiertos = context.findings.listByProject(projectId).filter((f) => f.status === 'open')
  const { summary, verdict } = auditSummary(countFindings(abiertos))

  return ok(
    context.omegaLog.append({
      projectId,
      agentId: 'sentinel-omega',
      kind: 'verificacion',
      verdict,
      summary,
      evidence: `proyecto ${project.name}`
    })
  )
}
