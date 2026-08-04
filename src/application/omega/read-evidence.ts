import type { FileSnippet } from '@domain/omega/filesystem-probe'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/**
 * Lee el codigo real alrededor de una linea citada por un hallazgo: la evidencia
 * que OMEGA muestra en el panel. Solo lectura y dentro del proyecto (el guarda
 * de path traversal vive en la sonda). OMEGA jamas escribe.
 */
export function readEvidence(
  context: AppContext,
  projectId: string,
  file: string,
  line: number
): Result<FileSnippet> {
  const project = context.projects.findById(projectId)
  if (!project) return err('Ese proyecto ya no existe')
  return ok(context.filesystemProbe.snippet(project.path, file, line))
}
