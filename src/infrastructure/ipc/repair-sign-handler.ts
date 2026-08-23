import { ipcMain } from 'electron'
import { firmarIntegracion } from '@application/repair/firmar-integracion'
import type { AutoMergeResult } from '@application/repair/auto-merge-types'
import { getAppContext } from '../persistence/app-context'
import { buildAutoMergeDeps } from '../repair/repair-deps'
import { endMerge } from '../run-control'
import { guardMerge } from '../run-guard'
import { IPC } from './channels'

/**
 * La FIRMA: el unico canal por el que un fix del motor llega al arbol vivo.
 *
 * Pide su PROPIO turno, no el del motor. Un drenaje dura media hora y trabaja
 * en worktrees aislados: hacer que la firma lo espere cerraba el proyecto sin
 * que hubiera nada que proteger. Dos firmas a la vez si se excluyen, que ahi si
 * hay un recurso compartido — la rama activa.
 */
export function registerSignHandler(): void {
  ipcMain.handle(IPC.repairSign, async (_event, proposalId: string): Promise<AutoMergeResult> => {
    const context = getAppContext()
    const id = String(proposalId)
    // El proyecto se DERIVA de la propuesta: recibirlo aparte permitiria pedir
    // la guardia de un proyecto y mergear en otro.
    const projectId = context.repairProposals.findById(id)?.projectId ?? ''
    const busy = guardMerge(context, projectId)
    if (busy !== null) return { applied: false, reason: busy, denial: null }

    try {
      return await firmarIntegracion(context, buildAutoMergeDeps(), { proposalId: id })
    } finally {
      endMerge(projectId)
    }
  })
}
