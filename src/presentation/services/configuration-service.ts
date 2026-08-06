import { api } from '../adapters/fortress-api'
import { useConfigurationStore } from '../stores/configuration-store'
import { reportError } from '../stores/toast-store'
import { sendMessage } from './chat-service'
import { loadProjects } from './project-service'

const TURN = { mode: 'supervisado' as const, excludedAgents: [] }

/** Aprueba el doc actual: avanza el indice y le pide el siguiente al agente. */
export function approveDoc(projectId: string): void {
  useConfigurationStore.getState().approve(projectId)
  void sendMessage({ projectId, prompt: 'aprobado', ...TURN })
}

export function restartConfig(projectId: string): void {
  useConfigurationStore.getState().restart(projectId)
  void sendMessage({ projectId, prompt: 'empieza de nuevo', ...TURN })
}

/** "Si, ejecutar": la app escribe el marco y commitea; el proyecto pasa a CONFIGURADO. */
export async function executeConfig(projectId: string): Promise<void> {
  const store = useConfigurationStore.getState()
  store.setExecuting(projectId, true)
  try {
    const result = await api().newProject.execute(projectId, store.drafts[projectId] ?? {})
    if (!result.ok) return reportError(result.error)
    await loadProjects()
    store.clear(projectId)
  } catch (error) {
    reportError(error instanceof Error ? error.message : 'No se pudo escribir el marco')
  } finally {
    store.setExecuting(projectId, false)
  }
}
