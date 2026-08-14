import { api } from '../adapters/fortress-api'
import { notify, reportError } from '../stores/toast-store'
import { useRepairStore } from '../stores/repair-store'

const SIN_CANDIDATO =
  'No hay hallazgo que reparar en este proyecto: escanealo primero, o los que quedan ya tienen propuesta viva.'

/**
 * Relee el expediente de propuestas y los hallazgos (para pintar cada fila).
 *
 * Si la lectura falla NO se guarda nada: el slot conserva el proyecto anterior,
 * su id no coincide con el activo y quien lee se calla. Guardar listas vacias
 * afirmaria que este proyecto no tiene propuestas sin haberlo comprobado.
 */
export async function loadRepair(projectId: string): Promise<void> {
  try {
    const [proposals, findings] = await Promise.all([
      api().repair.list(projectId),
      api().scan.findings(projectId)
    ])
    useRepairStore.getState().setData(projectId, proposals, findings)
  } catch (error) {
    console.error('[motor] no se pudo leer el expediente', projectId, error)
  }
}

/**
 * C1 elige + C2 analiza (agente real, solo lectura; puede tardar minutos).
 *
 * Un resultado correcto SIN propuesta se avisa igual: el motor no encontro
 * candidato, y sin ese aviso el boton se tragaria el clic en silencio. Sobre
 * el propio repo nunca se noto —siempre hay escaneo—; sobre un proyecto recien
 * registrado es el caso normal.
 */
export async function proposeRepair(projectId: string): Promise<void> {
  if (useRepairStore.getState().busy) return

  useRepairStore.getState().setBusy(true)
  try {
    const result = await api().repair.propose(projectId)
    if (!result.ok) reportError(result.error)
    else if (result.value === null) notify(SIN_CANDIDATO)
  } catch (error) {
    reportError(error instanceof Error ? error.message : 'Fallo al proponer la reparacion')
  } finally {
    useRepairStore.getState().setBusy(false)
    await loadRepair(projectId)
  }
}
