import { BrowserWindow } from 'electron'
import type { RepairProposalRepository } from '@domain/repair/proposal-repository'
import { IPC } from '../ipc/channels'

/**
 * Empuja al renderer que el expediente de un proyecto se movio. Se manda SOLO
 * el id, como hace el reindexado del grafo: quien escucha relee de la base.
 *
 * Mandar el estado entero seria una segunda copia del mismo hecho viajando por
 * el puente, con su propio momento de quedarse vieja. La base ya es la fuente;
 * esto es un golpecito en el hombro.
 *
 * El aviso sale para CUALQUIER proyecto, tambien los que el operador no tiene
 * delante. Filtrar aqui dejaria al motor trabajando a oscuras sobre los demas;
 * quien pinta decide si le toca.
 */
export function createRepairNotifier(
  proposals: RepairProposalRepository
): (proposalId: string) => void {
  return (proposalId) => {
    const projectId = proposals.findById(proposalId)?.projectId
    if (projectId === undefined) return

    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) win.webContents.send(IPC.repairChanged, projectId)
    }
  }
}
