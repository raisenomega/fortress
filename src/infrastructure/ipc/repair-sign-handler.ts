import { ipcMain } from 'electron'
import { firmarIntegracion } from '@application/repair/firmar-integracion'
import type { AutoMergeResult } from '@application/repair/auto-merge-types'
import { getAppContext } from '../persistence/app-context'
import { buildAutoMergeDeps } from '../repair/repair-deps'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'

/**
 * La FIRMA: el unico canal por el que un fix del motor llega al arbol vivo.
 *
 * Pasa por la misma guardia que cualquier corrida —ocupado, tope diario,
 * circuit breaker— porque aplica un merge sobre el repo del operador, que es la
 * accion mas cara que el motor puede provocar. Vive en su propio modulo por
 * eso: la puerta al repo se lee sola, no enterrada entre consultas.
 */
export function registerSignHandler(): void {
  ipcMain.handle(IPC.repairSign, async (_event, proposalId: string): Promise<AutoMergeResult> => {
    const context = getAppContext()
    const id = String(proposalId)
    // El proyecto se DERIVA de la propuesta: recibirlo aparte permitiria pedir
    // la guardia de un proyecto y mergear en otro.
    const projectId = context.repairProposals.findById(id)?.projectId ?? ''
    const busy = guardRun(context, projectId)
    if (busy !== null) return { applied: false, reason: busy, denial: null }

    try {
      return await firmarIntegracion(context, buildAutoMergeDeps(), { proposalId: id })
    } finally {
      endRun(projectId)
    }
  })
}
