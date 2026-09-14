import type { ResultadoVerificacionMasiva } from '@domain/repair/verificacion-masiva'
import { api } from '../adapters/fortress-api'
import { parteDeLaVerificacion } from './parte-de-la-verificacion'
import { loadFindings } from './scan-service'
import { notify, reportError } from '../stores/toast-store'
import { releerTrasElBarrido } from './recarga-tras-barrido'
import { useTableroStore } from '../stores/tablero-store'
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
export function verificarTodosLosMitigados(projectId: string, total: number): Promise<void> {
  return barrer(projectId, total, () => api().repair.verifyAll(projectId))
}

/** Las que el operador marco. Mismo barrido, misma barra, mismo parte: lo unico
 *  que cambia es la lista, y de eso ya se encarga el main. */
export function verificarSeleccionadas(projectId: string, ids: readonly string[]): Promise<void> {
  return barrer(projectId, ids.length, () => api().repair.verifySelected(projectId, ids))
}

async function barrer(
  projectId: string,
  total: number,
  lanzar: () => Promise<ResultadoVerificacionMasiva>
): Promise<void> {
  if (useVerificacionMasivaStore.getState().projectId !== null) return

  useVerificacionMasivaStore.getState().arrancar(projectId, total)
  const unsubscribe = api().repair.onChanged((id) => {
    if (id !== projectId) return
    useVerificacionMasivaStore.getState().avanzar()
    void loadFindings(projectId)
  })

  try {
    const { texto, tono } = parteDeLaVerificacion(await lanzar())
    if (tono === 'error') reportError(texto)
    else notify(texto, tono)
  } catch (error) {
    reportError(error instanceof Error ? error.message : 'Fallo al verificar los mitigados')
  } finally {
    unsubscribe()
    useVerificacionMasivaStore.getState().terminar()
    // La seleccion era «lo que voy a hacer», no «lo que hice». Los extinguidos
    // se podan solos al salir de la tabla, pero los `sin_prueba` siguen
    // MITIGADOS y seguirian marcados: la barra quedaria armada para regastar
    // sobre los mismos que acaban de contestar que no se pudo comprobar.
    useTableroStore.getState().limpiar(projectId)
    await releerTrasElBarrido(projectId)
  }
}

/** Pedir el alto. El barrido lo lee antes del siguiente mitigado y al volver de
 *  este, asi que el que corre termina y queda escrito. */
export async function pararVerificacionMasiva(projectId: string): Promise<void> {
  await api().repair.verifyAllStop(projectId)
}
