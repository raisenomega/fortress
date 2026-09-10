import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { runScan } from '@application/scan/run-scan'
import type { ScanSummary } from '@application/scan/scan-types'
import { err, type Result } from '@domain/shared/result'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { usesApiKey } from '@application/settings/read-auth-source'
import { readBudget } from '@application/settings/read-budget'
import { getAppContext } from '../persistence/app-context'
import { guardRun } from '../run-guard'
import { cancelRun, endRun, isCancelled } from '../run-control'
import { createClaudeScanner } from '../scan/claude-scanner'
import { medirProyecto } from '../scan/medir-proyecto'
import { scanLogWriter } from '../scan/write-scan-log'
import { asentarIntentoFallido } from '@application/scan/asentar-intento-fallido'
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
    const budget = readBudget(context)
    // El callback ve el intento con su FACTURA antes de que el fallo se
    // convierta en `err(string)` y deje de haber nada que asentar.
    const scanner = createClaudeScanner(
      createClaudeCodeAgent(context.apiKeys, budget, usesApiKey(context)),
      (intento) => asentarIntentoFallido(context, intento)
    )
    // El carril se toma UNA vez para todo el recorrido: las XX paradas son un
    // solo trabajo, y trocearlo dejaria colar otro escaneo entre dos de ellas.
    const salidas = { progreso: progresoDeEscaneo(event, projectId), scanLog: scanLogWriter }
    const deps = { cancelado: () => isCancelled(projectId), medir: medirProyecto }
    return await runScan(context, scanner, projectId, salidas, deps)
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
