import type { FinDelDrenaje } from '@application/repair/drenar-hasta-omega'
import type { NoticeTone } from '../components/common/Notice'
import { api } from '../adapters/fortress-api'
import { notify, reportError } from '../stores/toast-store'
import { useRepairStore } from '../stores/repair-store'
import { loadRepair } from './repair-service'

/**
 * Como se cuenta cada final, y con que cara. Solo agotar el pozo es un exito;
 * chocar con un tope o parar a mano no son fallos pero tampoco buenas noticias,
 * y pintarlos en verde afirmaria que el trabajo termino cuando quedo a medias.
 */
const PARTE: Record<FinDelDrenaje, { texto: (n: number) => string; tono: NoticeTone }> = {
  'sin-candidato': { texto: (n) => `Drenaje terminado: ${n} esperando firma, no queda nada elegible.`, tono: 'ok' }, // prettier-ignore
  'tope-vueltas': { texto: (n) => `Drenaje al tope de vueltas: ${n} esperando firma.`, tono: 'aviso' }, // prettier-ignore
  'tope-gasto': { texto: (n) => `Drenaje al tope de gasto: ${n} esperando firma.`, tono: 'aviso' },
  detenido: { texto: (n) => `Drenaje detenido. ${n} quedaron esperando firma.`, tono: 'aviso' },
  averia: { texto: (n) => `Drenaje cortado por una averia. ${n} esperando firma.`, tono: 'error' }
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
    const { texto, tono } = PARTE[r.fin]
    if (tono === 'error') reportError(`${texto(r.acumuladas)} ${r.detalle ?? ''}`.trim())
    else notify(texto(r.acumuladas), tono)
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
