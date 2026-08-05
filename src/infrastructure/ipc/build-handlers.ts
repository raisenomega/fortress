import { BrowserWindow, ipcMain } from 'electron'
import type { AppContext } from '@application/context'
import { err, type Result } from '@domain/shared/result'
import { runBuild } from '../build/run-build'
import { runBuildPlan } from '../build/run-build-plan'
import { runInvestigate } from '../build/run-investigate'
import { pickFile } from '../system/file-picker'
import { getAppContext } from '../persistence/app-context'
import { guardRun } from '../run-guard'
import { cancelRun, endRun } from '../run-control'
import { IPC } from './channels'

/** Un solo carril por proyecto: no dejar que build pise un scan/chat en curso. */
async function withGuard<T>(
  projectId: string,
  work: (context: AppContext) => Promise<Result<T>>
): Promise<Result<T>> {
  const context = getAppContext()
  const busy = guardRun(context, projectId)
  if (busy !== null) return err(busy)
  try {
    return await work(context)
  } finally {
    endRun(projectId)
  }
}

/** IPC de construccion. El plan de fase 1 lo aprueba el humano antes de fase 2. */
export function registerBuildHandlers(): void {
  ipcMain.handle(IPC.buildPlan, (_e, projectId: string, intent: string) =>
    withGuard(projectId, (ctx) => runBuildPlan(ctx, projectId, intent))
  )
  ipcMain.handle(IPC.buildInvestigate, (_e, projectId: string, intent: string) =>
    withGuard(projectId, (ctx) => runInvestigate(ctx, projectId, intent))
  )
  ipcMain.handle(IPC.buildFeature, (_e, projectId: string, intent: string, plan: string) =>
    withGuard(projectId, (ctx) => runBuild(ctx, projectId, intent, plan))
  )
  // Detener: corta el proceso del agente en marcha (plan o build) y desmarca.
  ipcMain.handle(IPC.buildStop, (_e, projectId: string) => cancelRun(projectId))
  ipcMain.handle(IPC.buildPickFile, (event) =>
    pickFile(BrowserWindow.fromWebContents(event.sender))
  )
}
