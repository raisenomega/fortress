import { api } from '../adapters/fortress-api'
import { reloadAfterScan } from './scan-service'

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
