import { api } from '../adapters/fortress-api'
import { usePushStore } from '../stores/push-store'

/**
 * El main vuelve a comprobar si el proyecto puede salir, asi que un rechazo
 * aqui llega como un error normal con su motivo: no hay que adivinarlo.
 */
export async function pushProject(projectId: string): Promise<void> {
  const store = usePushStore.getState()
  if (store.pushingProjectId) return

  store.startPush(projectId)

  try {
    const result = await api().push.run(projectId)
    usePushStore
      .getState()
      .finishPush(projectId, result.ok ? result.value : result.error, !result.ok)
  } catch (error) {
    // Igual que en el escaneo: si el canal falla, el boton tiene que volver.
    const detail = error instanceof Error ? error.message : 'El push se interrumpio'
    usePushStore.getState().finishPush(projectId, detail, true)
  }
}
