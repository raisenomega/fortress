import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { runScan } from '@application/scan/run-scan'
import type { ScanSummary } from '@application/scan/scan-types'
import type { ScanChunk } from '@domain/scan/scan-chunk'
import { err, type Result } from '@domain/shared/result'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { usesApiKey } from '@application/settings/read-auth-source'
import { readBudget } from '@application/settings/read-budget'
import { getAppContext } from '../persistence/app-context'
import { guardRun } from '../run-guard'
import { endRun } from '../run-control'
import { createClaudeScanner } from '../scan/claude-scanner'
import { IPC } from './channels'
import { registerFindingDecisionHandlers } from './finding-decision-handlers'

/** Emite progreso solo si la ventana sigue viva: un scan dura minutos. */
function progressSender(event: IpcMainInvokeEvent, projectId: string) {
  return (delta: string): void => {
    if (event.sender.isDestroyed()) return
    const chunk: ScanChunk = { projectId, delta }
    event.sender.send(IPC.scanProgress, chunk)
  }
}

async function handleRun(
  event: IpcMainInvokeEvent,
  projectId: string
): Promise<Result<ScanSummary>> {
  const context = getAppContext()
  const denegado = guardRun(context, projectId)
  if (denegado !== null) return err(denegado)

  const budget = readBudget(context)
  const scanner = createClaudeScanner(
    createClaudeCodeAgent(context.apiKeys, budget, usesApiKey(context))
  )

  try {
    return await runScan(context, scanner, projectId, progressSender(event, projectId))
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

  registerFindingDecisionHandlers()
}
