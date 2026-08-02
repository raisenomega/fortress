import type { NewProjectDraft } from '@domain/newproject/new-project-draft'
import { api } from '../adapters/fortress-api'
import { useNewProjectStore } from '../stores/new-project-store'

/** Recalcula la ruta que saldria. No crea nada: solo la ensena. */
export async function refreshPlan(draft: NewProjectDraft): Promise<void> {
  const store = useNewProjectStore.getState()

  if (draft.name.trim() === '' || draft.parentDir === '') {
    return store.setPlan(null, null)
  }

  const plan = await api().newProject.planFolder(draft)
  if (plan.ok) return store.setPlan(plan.value.target, plan.value.existing)

  store.setPlan(null, null)
  store.setError(plan.error)
}

/** Crea la carpeta. Es el primer paso que toca el disco del operador. */
export async function createFolder(): Promise<void> {
  const { draft, useExisting } = useNewProjectStore.getState()
  const result = await api().newProject.createFolder(draft, useExisting)

  if (result.ok) return useNewProjectStore.getState().setCreated(result.value)
  useNewProjectStore.getState().setError(result.error)
}
