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

export async function removeProject(id: string): Promise<Result<null>> {
  const result = await api().projects.remove(id)
  if (result.ok) await loadProjects()
  return result
}
