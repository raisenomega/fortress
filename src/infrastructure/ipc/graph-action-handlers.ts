import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { usesApiKey } from '@application/settings/read-auth-source'
import type { GraphVerify } from '@domain/graph/graph-actions'
import type { GraphStatus } from '@domain/graph/graph-status'
import { err, type Result } from '@domain/shared/result'
import { abGraph } from '../graph/ab-graph'
import { installGraph } from '../graph/install-graph'
import { verifyGraph } from '../graph/verify-graph'
import { getAppContext } from '../persistence/app-context'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'

const NO_GRAPH: GraphVerify = { connected: false, tools: [] }

function logger(event: IpcMainInvokeEvent, projectId: string): (delta: string) => void {
  return (delta) => {
    if (!event.sender.isDestroyed()) event.sender.send(IPC.graphProgress, { projectId, delta })
  }
}

async function handleInstall(event: IpcMainInvokeEvent, id: string): Promise<Result<GraphStatus>> {
  const context = getAppContext()
  const busy = guardRun(context, id)
  if (busy !== null) return err(busy)
  try {
    return await installGraph(context, id, logger(event, id))
  } finally {
    endRun(id)
  }
}

function handleVerify(id: string): Promise<GraphVerify> {
  const context = getAppContext()
  const project = context.projects.findById(id)
  if (!project) return Promise.resolve(NO_GRAPH)
  return verifyGraph(project.path, usesApiKey(context) ? context.apiKeys.read() : null)
}

/** IPC de las acciones del grafo. La instalacion y el A/B ocupan el carril del proyecto. */
export function registerGraphActionHandlers(): void {
  ipcMain.handle(IPC.graphInstall, (event, id: string) => handleInstall(event, id))
  ipcMain.handle(IPC.graphVerify, (_event, id: string) => handleVerify(id))
  ipcMain.handle(IPC.graphAb, (_event, id: string, question: string) =>
    abGraph(getAppContext(), id, question)
  )
}
