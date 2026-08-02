import type { GitPusher } from '@domain/project/git-pusher'
import { PUSH_REASON, pushState } from '@domain/project/push-readiness'
import { EMPTY_COUNTS } from '@domain/project/severity-counts'
import { err, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/**
 * La comprobacion vive aqui y no solo en el boton. Un boton deshabilitado es
 * una cortesia visual: quien llame al canal IPC directamente se lo salta. El
 * bloqueo por CRITICAL tiene que estar en el unico camino que ejecuta git.
 */
export async function pushProject(
  context: AppContext,
  git: GitPusher,
  projectId: string
): Promise<Result<string>> {
  const project = context.projects.findById(projectId)
  if (!project) return err('El proyecto ya no existe')

  const counts = context.findings.countsByProject()[projectId] ?? EMPTY_COUNTS
  const state = pushState(project, counts)
  if (state !== 'listo') return err(PUSH_REASON[state])

  return git.push(project.path)
}
