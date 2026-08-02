import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { dismissFinding, reopenFinding } from '@application/scan/dismiss-finding'
import { runScan } from '@application/scan/run-scan'
import type { ScanSummary } from '@application/scan/scan-types'
import type { ScanChunk } from '@domain/scan/scan-chunk'
import { err, type Result } from '@domain/shared/result'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { getAppContext } from '../persistence/app-context'
import { createClaudeScanner } from '../scan/claude-scanner'
import { IPC } from './channels'

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
  const scanner = createClaudeScanner(createClaudeCodeAgent(context.apiKeys))

  try {
    return await runScan(context, scanner, projectId, progressSender(event, projectId))
  } catch (error) {
    return err(error instanceof Error ? error.message : 'Fallo inesperado al escanear')
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

  ipcMain.handle(IPC.scanDismiss, (_event, findingId: string) =>
    dismissFinding(getAppContext(), findingId)
  )

  ipcMain.handle(IPC.scanReopen, (_event, findingId: string) =>
    reopenFinding(getAppContext(), findingId)
  )
}
