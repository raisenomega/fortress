import type { NewProject, Project } from '@domain/project/project'
import type { Result } from '@domain/shared/result'
import { api } from '../adapters/fortress-api'
import { useProjectStore } from '../stores/project-store'

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
  const result = await api().projects.setTrusted(id, trusted)
  if (result.ok) await loadProjects()
}

export async function setProjectLoopEnabled(id: string, enabled: boolean): Promise<void> {
  const result = await api().projects.setLoopEnabled(id, enabled)
  if (result.ok) await loadProjects()
}
