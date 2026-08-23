import type { FinDelDrenaje } from '@application/repair/drenar-hasta-omega'
import { api } from '../adapters/fortress-api'
import { notify, reportError } from '../stores/toast-store'
import { useRepairStore } from '../stores/repair-store'
import { loadRepair } from './repair-service'

/** Como se cuenta cada final. Detenido NO es un fallo: fue una decision. */
const PARTE: Record<FinDelDrenaje, (n: number) => string> = {
  'sin-candidato': (n) => `Drenaje terminado: ${n} esperando firma, no queda nada elegible.`,
  'tope-vueltas': (n) => `Drenaje al tope de vueltas: ${n} esperando firma.`,
  'tope-gasto': (n) => `Drenaje al tope de gasto: ${n} esperando firma.`,
  detenido: (n) => `Drenaje detenido. ${n} quedaron esperando firma.`,
  averia: (n) => `Drenaje cortado por una averia. ${n} esperando firma.`
}

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
    const parte = PARTE[r.fin](r.acumuladas)
    if (r.fin === 'averia') reportError(`${parte} ${r.detalle ?? ''}`.trim())
    else notify(parte)
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
