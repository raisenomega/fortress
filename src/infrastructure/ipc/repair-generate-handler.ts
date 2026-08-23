import { ipcMain } from 'electron'
import { generateFix } from '@application/repair/generate-fix'
import type { GenerateResult } from '@application/repair/generate-types'
import { getAppContext } from '../persistence/app-context'
import { buildGenerateDeps } from '../repair/repair-deps'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'

/**
 * C3 spawnea un agente que EDITA (solo en el worktree): pasa por la misma
 * guardia que cualquier corrida — busy, tope diario y contaminacion — anclada
 * al proyecto de la propuesta.
 */
export function registerRepairGenerateHandler(): void {
  ipcMain.handle(
    IPC.repairGenerate,
    async (_event, proposalId: string): Promise<GenerateResult> => {
      const context = getAppContext()
      const proposal = context.repairProposals.findById(String(proposalId))
      if (!proposal) return { ok: false, reason: 'invalid_state', detail: 'propuesta desconocida' }
      const busy = guardRun(context, proposal.projectId)
      if (busy !== null) return { ok: false, reason: 'invalid_state', detail: busy }
      try {
        return await generateFix(context, proposal.id, buildGenerateDeps(proposal.projectId))
      } finally {
        endRun(proposal.projectId)
      }
    }
  )
}
