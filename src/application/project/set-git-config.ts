import type { GitIdentitySetter, GitRemoteSetter } from '@domain/project/git-config-setter'
import { err, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/**
 * Fijar identidad/remoto de un proyecto DESDE FORTRESS (PASO 163, Sello 2a).
 * La capa de aplicación resuelve el projectId → ruta y delega en el puerto; la
 * comprobación de raíz y la escritura viven en el adaptador (infraestructura).
 * Solo lo invoca una acción del operador: nunca se dispara solo.
 */
export function setProjectIdentity(
  context: AppContext,
  setter: GitIdentitySetter,
  projectId: string,
  name: string,
  email: string
): Result<string> {
  const project = context.projects.findById(projectId)
  if (!project) return err('El proyecto ya no existe')
  return setter.setIdentity(project.path, name, email)
}

export function setProjectRemote(
  context: AppContext,
  setter: GitRemoteSetter,
  projectId: string,
  url: string
): Result<string> {
  const project = context.projects.findById(projectId)
  if (!project) return err('El proyecto ya no existe')
  return setter.setRemote(project.path, url)
}
