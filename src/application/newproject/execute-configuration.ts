import { DRAFTED_DOCS } from '@domain/chat/config-docs'
import { buildGovernanceFiles } from '@domain/chat/governance-files'
import { isPending } from '@domain/project/config-state'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/** Puerto de escritura del marco: escribe los archivos y hace el commit inicial. */
export interface GovernanceWriter {
  write(projectPath: string, files: Record<string, string>): Promise<Result<string>>
}

/**
 * "Si, ejecutar": escribe el marco APROBADO en disco y marca el proyecto
 * CONFIGURADO. Valida que esten los 7 documentos —nada se escribe a medias— y
 * es la unica via que toca el disco durante la configuracion (el agente nunca).
 */
export async function executeConfiguration(
  context: AppContext,
  writer: GovernanceWriter,
  projectId: string,
  drafts: Record<string, string>
): Promise<Result<string>> {
  const project = context.projects.findById(projectId)
  if (!project) return err('El proyecto ya no existe')
  // No re-escribir un proyecto ya configurado: pisaria docs y COGNITION-LOG.
  if (!isPending(project.configState)) return err('El proyecto ya esta configurado.')
  if (drafts === null || typeof drafts !== 'object') return err('Borradores invalidos.')

  const missing = DRAFTED_DOCS.filter((doc) => !drafts[doc]?.trim())
  if (missing.length > 0) return err(`Faltan documentos por aprobar: ${missing.join(', ')}`)

  const written = await writer.write(project.path, buildGovernanceFiles(project.name, drafts))
  if (!written.ok) return written

  context.projects.setConfigState(projectId, 'CONFIGURADO')
  return ok('Marco escrito y proyecto configurado.')
}
