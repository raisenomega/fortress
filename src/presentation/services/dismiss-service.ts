import { api } from '../adapters/fortress-api'
import { reloadAfterScan } from './recarga-tras-escaneo'

/**
 * Descartar cambia el score y puede desbloquear un push, asi que despues hay
 * que releerlo todo: hallazgos, conteos y la fila del proyecto.
 */
async function setDismissed(projectId: string, findingId: string, off: boolean): Promise<void> {
  const call = off ? api().scan.dismiss : api().scan.reopen
  await call(findingId)
  await reloadAfterScan(projectId)
}

export function dismissFinding(projectId: string, findingId: string): Promise<void> {
  return setDismissed(projectId, findingId, true)
}

export function reopenFinding(projectId: string, findingId: string): Promise<void> {
  return setDismissed(projectId, findingId, false)
}

/**
 * Marcar como arreglado saca el hallazgo de la cola del motor pero lo deja en el
 * tablero, asi que hay que releer igual: la fila cambia de aspecto.
 */
export async function mitigateFinding(
  projectId: string,
  findingId: string,
  note: string
): Promise<void> {
  await api().scan.mitigate(findingId, note)
  await reloadAfterScan(projectId)
}

/** Deshacer la marca la devuelve a la cola: hay que releer igual. */
export async function unmitigateFinding(projectId: string, findingId: string): Promise<void> {
  await api().scan.unmitigate(findingId)
  await reloadAfterScan(projectId)
}
