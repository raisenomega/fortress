import { BrowserWindow, ipcMain } from 'electron'
import type { AppContext } from '@application/context'
import { err, type Result } from '@domain/shared/result'
import type { TurnoLibre } from '@domain/build/libre-prompt'
import { runBuild } from '../build/run-build'
import { runBuildPlan } from '../build/run-build-plan'
import { runInvestigate } from '../build/run-investigate'
import { runLibre } from '../build/run-libre'
import { pickFile } from '../system/file-picker'
import { getAppContext } from '../persistence/app-context'
import { guardRun } from '../run-guard'
import { cancelRun, endRun } from '../run-control'
import { chunkSender } from './chat-send-senders'
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
  // Los trozos van por el canal del chat, tachados por chunkSender; no hay
  // cruce: withGuard impone un solo carril por proyecto (chat o build, no ambos).
  ipcMain.handle(IPC.buildPlan, (e, projectId: string, intent: string) =>
    withGuard(projectId, (ctx) => runBuildPlan(ctx, projectId, intent, chunkSender(e, projectId)))
  )
  ipcMain.handle(IPC.buildInvestigate, (e, projectId: string, intent: string) =>
    withGuard(projectId, (ctx) => runInvestigate(ctx, projectId, intent, chunkSender(e, projectId)))
  )
  // LIBRE: sin proyecto no hay carril que guardar; el doble-envio lo frena el
  // busy del renderer. Los trozos van al id centinela que el servicio escucha.
  ipcMain.handle(IPC.buildLibre, (e, pregunta: string, hilo: TurnoLibre[]) =>
    runLibre(getAppContext(), pregunta, hilo, chunkSender(e, 'chat-libre'))
  )
  ipcMain.handle(IPC.buildFeature, (e, projectId: string, intent: string, plan: string) =>
    withGuard(projectId, (ctx) => runBuild(ctx, projectId, intent, plan, chunkSender(e, projectId)))
  )
  // Detener: corta el proceso del agente en marcha (plan o build) y desmarca.
  ipcMain.handle(IPC.buildStop, (_e, projectId: string) => cancelRun(projectId))
  ipcMain.handle(IPC.buildPickFile, (event) =>
    pickFile(BrowserWindow.fromWebContents(event.sender))
  )
}
