import type { NewProject, Project } from '@domain/project/project'
import type { Result } from '@domain/shared/result'
import { api } from '../adapters/fortress-api'
import { useProjectStore } from '../stores/project-store'
import { reportError } from '../stores/toast-store'

/** Recarga la lista completa desde SQLite y la vuelca en el store. */
export async function loadProjects(): Promise<void> {
  const store = useProjectStore.getState()
  store.setLoading(true)
  try {
    store.setProjects(await api().projects.list())
  } finally {
    store.setLoading(false)
  }
}

export async function addProject(input: NewProject): Promise<Result<Project>> {
  const result = await api().projects.add(input)
  if (result.ok) {
    await loadProjects()
    useProjectStore.getState().setActiveProject(result.value.id)
  }
  return result
}

/**
 * Agrega FORTRESS a si misma para poder auditarla con sus propios agentes.
 * Devuelve null si el codigo fuente no esta accesible en disco.
 */
export async function addSelfProject(): Promise<Result<Project> | null> {
  const self = await api().projects.self()
  if (!self) return null
  return addProject(self)
}

export async function removeProject(id: string): Promise<Result<null>> {
  const result = await api().projects.remove(id)
  if (result.ok) await loadProjects()
  return result
}

export async function setProjectTrusted(id: string, trusted: boolean): Promise<void> {
  try {
    const result = await api().projects.setTrusted(id, trusted)
    if (result.ok) await loadProjects()
    else reportError(result.error)
  } catch (error) {
    reportError(error instanceof Error ? error.message : 'No se pudo cambiar la confianza')
  }
}

/** Levanta el circuit breaker de la Capa 4. Al recargar, el proyecto llega ya
 *  sin marca y el aviso se apaga solo: no hay estado local que acordarse de bajar. */
export async function desbloquearProyecto(id: string): Promise<void> {
  try {
    const result = await api().projects.unblock(id)
    if (result.ok) await loadProjects()
    else reportError(result.error)
  } catch (error) {
    reportError(error instanceof Error ? error.message : 'No se pudo desbloquear el proyecto')
  }
}
