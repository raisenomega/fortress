import { api } from '../adapters/fortress-api'
import { loadProjects } from './project-service'
import { useQualityStore } from '../stores/quality-store'

/**
 * Audita las 6 dimensiones y recarga los proyectos: el score integral vive en la
 * fila del proyecto, asi que la tarjeta queda vieja hasta releer. Los probes corren
 * async (spawn) en el main: puede tardar minutos pero NO congela la ventana.
 */
export async function auditQuality(projectId: string): Promise<void> {
  const store = useQualityStore.getState()
  if (store.runningProjectId) return

  store.start(projectId)
  try {
    const result = await api().quality.run(projectId)
    store.finish(projectId, result.ok ? result.value : null, result.ok ? null : result.error)
  } catch (error) {
    // Un fallo del canal IPC no debe dejar la auditoria "en curso" para siempre.
    const detail = error instanceof Error ? error.message : 'La auditoria se interrumpio'
    useQualityStore.getState().finish(projectId, null, detail)
  } finally {
    await loadProjects().catch(() => undefined)
  }
}
