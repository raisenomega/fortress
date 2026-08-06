import type { NewProjectDraft } from '@domain/newproject/new-project-draft'
import type { Project } from '@domain/project/project'
import { api } from '../adapters/fortress-api'
import { useNewProjectStore } from '../stores/new-project-store'
import { useProjectStore } from '../stores/project-store'
import { useUiStore } from '../stores/ui-store'
import { loadProjects } from './project-service'

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

/** Tras crear y registrar: activa el proyecto y abre el chat (modo entrevista). */
async function finishCreation(project: Project): Promise<void> {
  await loadProjects()
  useProjectStore.getState().setActiveProject(project.id)
  useUiStore.getState().setProjectDialog(null)
  useUiStore.getState().setView('chat')
  useNewProjectStore.getState().reset()
}

/**
 * Crea la carpeta, inicia git y registra el proyecto en PENDIENTE_CONFIGURACION.
 * El chat entra en modo entrevista hasta que se apruebe y escriba el marco.
 */
export async function createFolder(): Promise<void> {
  const store = useNewProjectStore.getState()
  const { draft, useExisting } = store
  try {
    const created = await api().newProject.createFolder(draft, useExisting)
    if (!created.ok) return store.setError(created.error)

    const registered = await api().newProject.register({
      name: draft.name,
      path: created.value,
      stack: draft.stack
    })
    if (registered.ok) return finishCreation(registered.value)
    store.setError(registered.error)
  } catch (error) {
    store.setError(error instanceof Error ? error.message : 'No se pudo crear el proyecto')
  }
}
