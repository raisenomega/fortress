import { ipcMain } from 'electron'
import { runOmega, type RunOmegaResult } from '@application/repair/run-omega'
import { getAppContext } from '../persistence/app-context'
import { buildOmegaDeps } from '../repair/repair-deps'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'

/**
 * I4 — OMEGA gasta modelo (lectura estricta): misma guardia por-proyecto que
 * toda corrida, y la cola de juicio (compartida con el gate) dentro de runOmega.
 */
export function registerRepairOmegaHandler(): void {
  ipcMain.handle(
    IPC.repairRunOmega,
    async (_event, proposalId: string): Promise<RunOmegaResult> => {
      const context = getAppContext()
      const proposal = context.repairProposals.findById(String(proposalId))
      if (!proposal) return { ok: false, reason: 'invalid_state' }
      const busy = guardRun(context, proposal.projectId)
      if (busy !== null) return { ok: false, reason: busy }
      try {
        return await runOmega(context, proposal.id, buildOmegaDeps())
      } finally {
        endRun(proposal.projectId)
      }
    }
  )
}
