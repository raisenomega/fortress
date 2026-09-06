import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { usesApiKey } from '@application/settings/read-auth-source'
import type { GraphAb, GraphVerify } from '@domain/graph/graph-actions'
import type { GraphStatus } from '@domain/graph/graph-status'
import { err, type Result } from '@domain/shared/result'
import { abGraph } from '../graph/ab-graph'
import { installGraph } from '../graph/install-graph'
import { verifyGraph } from '../graph/verify-graph'
import { getAppContext } from '../persistence/app-context'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'
import { sinSecretosEnVivo } from '@application/chat/en-vivo-tachado'
import { IPC } from './channels'

const NO_GRAPH: GraphVerify = { connected: false, tools: [] }

/** Tachado: sale lo que el CLI del grafo dice del repo auditado. */
function logger(event: IpcMainInvokeEvent, projectId: string): (delta: string) => void {
  return sinSecretosEnVivo((delta) => {
    if (!event.sender.isDestroyed()) event.sender.send(IPC.graphProgress, { projectId, delta })
  })
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

/**
 * El A/B lanza DOS corridas del CLI. Sin el guard evadia el tope diario, el
 * carril de concurrencia y el circuit breaker de contaminacion: tres redes que
 * el resto de los canales que gastan si respetan.
 */
async function handleAb(id: string, question: string): Promise<Result<GraphAb>> {
  const context = getAppContext()
  const busy = guardRun(context, id)
  if (busy !== null) return err(busy)
  try {
    return await abGraph(context, id, question)
  } finally {
    endRun(id)
  }
}

/** Verificar tambien spawnea el CLI con la key, y el breaker vale aunque casi no
 *  gaste. El motivo del rechazo sale por graph:progress: `GraphVerify` es plano,
 *  y devolverlo mudo confunde bloqueado con "no conecta". */
async function handleVerify(event: IpcMainInvokeEvent, id: string): Promise<GraphVerify> {
  const context = getAppContext()
  const project = context.projects.findById(id)
  if (!project) return NO_GRAPH
  const busy = guardRun(context, id)
  if (busy !== null) {
    logger(event, id)(busy)
    return NO_GRAPH
  }
  try {
    return await verifyGraph(project.path, usesApiKey(context) ? context.apiKeys.read() : null)
  } finally {
    endRun(id)
  }
}

/** IPC de las acciones del grafo. Las tres ocupan el carril del proyecto. */
export function registerGraphActionHandlers(): void {
  ipcMain.handle(IPC.graphInstall, (event, id: string) => handleInstall(event, id))
  ipcMain.handle(IPC.graphVerify, (event, id: string) => handleVerify(event, id))
  ipcMain.handle(IPC.graphAb, (_event, id: string, question: string) => handleAb(id, question))
}
