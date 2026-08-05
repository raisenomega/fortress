import { ipcMain } from 'electron'
import type { AppContext } from '@application/context'
import { err, type Result } from '@domain/shared/result'
import { runBuild, runBuildPlan } from '../build/run-build'
import { getAppContext } from '../persistence/app-context'
import { guardRun } from '../run-guard'
import { endRun } from '../run-control'
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
  ipcMain.handle(IPC.buildFeature, (_e, projectId: string, intent: string, plan: string) =>
    withGuard(projectId, (ctx) => runBuild(ctx, projectId, intent, plan))
  )
}
