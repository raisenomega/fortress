import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { runScan } from '@application/scan/run-scan'
import type { ScanSummary } from '@application/scan/scan-types'
import { err, type Result } from '@domain/shared/result'
import { getAppContext } from '../persistence/app-context'
import { guardRun } from '../run-guard'
import { cancelRun, endRun, isCancelled } from '../run-control'
import { armarEscaneo } from '../scan/armar-escaneo'
import { scanLogWriter } from '../scan/write-scan-log'
import { IPC } from './channels'
import { progresoDeEscaneo } from './scan-progress'
import { registerFindingDecisionHandlers } from './finding-decision-handlers'

async function handleRun(
  event: IpcMainInvokeEvent,
  projectId: string
): Promise<Result<ScanSummary>> {
  const context = getAppContext()
  const denegado = guardRun(context, projectId)
  if (denegado !== null) return err(denegado)

  // Dentro del try: leer el presupuesto y armar el escaner puede fallar, y
  // fuera ese fallo dejaba el carril tomado hasta reiniciar.
  try {
    // El escaner y el juez del alcance, del mismo agente y el mismo presupuesto.
    // El juicio corre DENTRO del carril: `guardRun` ya paso y `endRun` espera en
    // el finally, asi que su proceso no se escapa del candado.
    const { scanner, medir } = armarEscaneo(context, projectId)
    // El carril se toma UNA vez para todo el recorrido: las XX paradas son un
    // solo trabajo, y trocearlo dejaria colar otro escaneo entre dos de ellas.
    const salidas = { progreso: progresoDeEscaneo(event, projectId), scanLog: scanLogWriter }
    return await runScan(context, scanner, projectId, salidas, {
      cancelado: () => isCancelled(projectId),
      medir
    })
  } catch (error) {
    return err(error instanceof Error ? error.message : 'Fallo inesperado al escanear')
  } finally {
    endRun(projectId)
  }
}

export function registerScanHandlers(): void {
  ipcMain.handle(IPC.scanRun, (event, projectId: string) => handleRun(event, projectId))

  ipcMain.handle(IPC.scanFindings, (_event, projectId: string) =>
    getAppContext().findings.listByProject(projectId)
  )

  ipcMain.handle(IPC.scanCounts, () => getAppContext().findings.countsByProject())

  // Lo CERRADO, que el tablero no ensena: `SELECT_BY_PROJECT` filtra los
  // extintos a proposito. Su pantalla es la historia (ADR-087).
  ipcMain.handle(IPC.scanHistoria, (_event, projectId: string) =>
    getAppContext().findings.listHistoria(String(projectId))
  )

  ipcMain.handle(IPC.scanHistory, (_event, projectId: string, limit: number) =>
    getAppContext().scans.listByProject(projectId, limit)
  )

  ipcMain.handle(IPC.scanHistorySince, (_event, since: string) =>
    getAppContext().scans.listSince(since)
  )

  // Detener: marca la cancelacion y mata al hijo en curso. El recorrido la lee
  // en la frontera de la SIGUIENTE parada, asi que la que corre termina.
  ipcMain.handle(IPC.scanStop, (_event, projectId: string) => cancelRun(String(projectId)))

  registerFindingDecisionHandlers()
}
