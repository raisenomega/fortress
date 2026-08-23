import { api } from '../adapters/fortress-api'
import { parteDelDrenaje } from './parte-del-drenaje'
import { notify, reportError } from '../stores/toast-store'
import { useRepairStore } from '../stores/repair-store'
import { loadRepair } from './repair-service'

/**
 * Arranca el drenaje y cuenta como acabo. El avance no se narra: las propuestas
 * van apareciendo solas en la cola de firma segun se juzgan, que es mejor parte
 * que cualquier texto.
 */
export async function drenar(projectId: string): Promise<void> {
  const store = useRepairStore.getState()
  if (store.drenando) return

  store.setDrenando(true)
  try {
    const r = await api().repair.drain(projectId)
    const { texto, tono } = parteDelDrenaje(r)
    if (tono === 'error') reportError(`${texto} ${r.detalle ?? ''}`.trim())
    else notify(texto, tono)
  } catch (error) {
    reportError(error instanceof Error ? error.message : 'Fallo al drenar')
  } finally {
    useRepairStore.getState().setDrenando(false)
    await loadRepair(projectId)
  }
}

/** Pedir el alto. El drenaje lo lee antes de la vuelta siguiente y al volver. */
export async function pararDrenaje(projectId: string): Promise<void> {
  await api().repair.drainStop(projectId)
}
