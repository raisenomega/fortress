import { ipcMain } from 'electron'
import { retryRepair, type RetryResult } from '@application/repair/retry-repair'
import { getAppContext } from '../persistence/app-context'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'

/**
 * I4.2 — el reintento corre un C2 FRESCO (gasta modelo): misma guardia
 * por-proyecto que toda corrida. Las guardas de elegibilidad (D24) viven en
 * el caso de uso; aqui solo se resuelve el proyecto para la guardia.
 */
export function registerRepairRetryHandler(): void {
  ipcMain.handle(IPC.repairRetry, async (_event, proposalId: string): Promise<RetryResult> => {
    const context = getAppContext()
    const proposal = context.repairProposals.findById(String(proposalId))
    if (!proposal) return { ok: false, reason: 'unknown_proposal' }
    const busy = guardRun(context, proposal.projectId)
    if (busy !== null) return { ok: false, reason: busy }
    try {
      return await retryRepair(context, proposal.id)
    } finally {
      endRun(proposal.projectId)
    }
  })
}
