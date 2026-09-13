import { api } from '../adapters/fortress-api'
import { parteDeLaVerificacion } from './parte-de-la-verificacion'
import { loadCounts, loadFindings } from './scan-service'
import { loadProjects } from './project-service'
import { notify, reportError } from '../stores/toast-store'
import { useVerificacionMasivaStore } from '../stores/verificacion-masiva-store'

/**
 * Lanza el barrido de mitigados y cuenta como acabo (ADR-087, Fase 3).
 *
 * EL AVANCE SE CUENTA ESCUCHANDO AL MOTOR. El main no manda progreso propio:
 * manda su golpecito de siempre tras cada verificacion, y esa misma linea hace
 * tres cosas a la vez — mueve el contador, relee la tabla (los mitigados caen a
 * la vista segun se resuelven) y sube el gasto del pie, que ya escucha ese canal
 * desde el arranque. Un canal de progreso nuevo habria sido una cuarta copia del
 * mismo hecho.
 */
export async function verificarTodosLosMitigados(projectId: string, total: number): Promise<void> {
  if (useVerificacionMasivaStore.getState().projectId !== null) return

  useVerificacionMasivaStore.getState().arrancar(projectId, total)
  const unsubscribe = api().repair.onChanged((id) => {
    if (id !== projectId) return
    useVerificacionMasivaStore.getState().avanzar()
    void loadFindings(projectId)
  })

  try {
    const { texto, tono } = parteDeLaVerificacion(await api().repair.verifyAll(projectId))
    if (tono === 'error') reportError(texto)
    else notify(texto, tono)
  } catch (error) {
    reportError(error instanceof Error ? error.message : 'Fallo al verificar los mitigados')
  } finally {
    unsubscribe()
    useVerificacionMasivaStore.getState().terminar()
    await releerTrasElBarrido(projectId)
  }
}

/**
 * Releer despues del barrido no puede tumbar el barrido: lo verificado ya esta
 * en la base y el parte en pantalla. El score se toca —los extinguidos salen del
 * expediente y los que siguen vivos vuelven a la cola—, asi que la lista de
 * proyectos tambien queda vieja, no solo la tabla.
 */
async function releerTrasElBarrido(projectId: string): Promise<void> {
  try {
    await Promise.all([loadFindings(projectId), loadCounts(), loadProjects()])
  } catch {
    // Silencio deliberado: el barrido si termino.
  }
}

/** Pedir el alto. El barrido lo lee antes del siguiente mitigado y al volver de
 *  este, asi que el que corre termina y queda escrito. */
export async function pararVerificacionMasiva(projectId: string): Promise<void> {
  await api().repair.verifyAllStop(projectId)
}
