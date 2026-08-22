import { BrowserWindow } from 'electron'
import { reconcileGraph, type ReconcileOutcome } from '@application/graph/reconcile-graph'
import { getAppContext } from '../persistence/app-context'
import { IPC } from '../ipc/channels'
import { reindexQueue } from './reindex-queue'
import { createReindexRunner } from './reindex-runner'

/** Push al renderer: el estado de indexado de ese proyecto cambio. */
function notify(projectId: string): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(IPC.graphReindexChanged, projectId)
  }
}

/** Reconcilia UN proyecto con las dependencias reales del proceso. */
export function reconcileProject(projectId: string, onBoot = false): Promise<ReconcileOutcome> {
  return reconcileGraph(
    getAppContext(),
    projectId,
    { runner: createReindexRunner(), enqueue: (job) => reindexQueue.enqueue(job), notify, now: Date.now }, // prettier-ignore
    onBoot
  )
}

/**
 * On-boot: evalua TODOS los proyectos; la cola de 1 los serializa. Sin await.
 *
 * Es el UNICO sitio que pasa `onBoot`. Aqui ninguna corrida previa sigue viva
 * —la cola es de memoria y el indexador es un hijo del proceso—, asi que una
 * marca RUNNING heredada se reclama en el acto en vez de respetarse.
 */
export function reconcileAllOnBoot(): void {
  for (const project of getAppContext().projects.list()) void reconcileProject(project.id, true)
}
