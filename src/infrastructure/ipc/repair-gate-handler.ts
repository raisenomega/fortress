import { ipcMain } from 'electron'
import { runGate, type RunGateResult } from '@application/repair/run-gate'
import { getAppContext } from '../persistence/app-context'
import { buildGateDeps } from '../repair/repair-deps'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'

/**
 * I3 — el gate no gasta modelo pero come CPU y minutos: pasa por la misma
 * guardia por-proyecto que toda corrida (busy + contaminacion), y por la cola
 * serial de 1 que vive dentro de runGate.
 */
export function registerRepairGateHandler(): void {
  ipcMain.handle(IPC.repairRunGate, async (_event, proposalId: string): Promise<RunGateResult> => {
    const context = getAppContext()
    const proposal = context.repairProposals.findById(String(proposalId))
    if (!proposal) return { ok: false, reason: 'invalid_state' }
    const busy = guardRun(context, proposal.projectId)
    if (busy !== null) return { ok: false, reason: busy }
    try {
      return await runGate(context, proposal.id, buildGateDeps())
    } finally {
      endRun(proposal.projectId)
    }
  })
}
