import { ipcMain } from 'electron'
import { autoMergeProposal } from '@application/repair/auto-merge-proposal'
import { runOmega, type RunOmegaResult } from '@application/repair/run-omega'
import type { AppContext } from '@application/context'
import { getAppContext } from '../persistence/app-context'
import { buildAutoMergeDeps, buildOmegaDeps } from '../repair/repair-deps'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'

/**
 * La integracion automatica no puede tumbar el resultado de OMEGA: ese juicio
 * ya se emitio y ya esta asentado. Si falla, se anota y el veredicto sale igual.
 */
async function integrarSuave(context: AppContext, proposalId: string): Promise<void> {
  try {
    await autoMergeProposal(context, buildAutoMergeDeps(), { proposalId })
  } catch (error) {
    console.error('[repair-omega] fallo la integracion automatica', proposalId, error)
  }
}

/**
 * I4 — OMEGA gasta modelo (lectura estricta): misma guardia por-proyecto que
 * toda corrida, y la cola de juicio (compartida con el gate) dentro de runOmega.
 *
 * El auto-merge va DENTRO del guard: integrar es escribir en el repo vivo, y
 * dejarlo fuera abriria la ventana justo donde otra corrida podria empezar.
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
        const result = await runOmega(context, proposal.id, buildOmegaDeps())
        if (result.ok && result.verdict.veredicto_global === 'APROBADO') {
          await integrarSuave(context, proposal.id)
        }
        return result
      } finally {
        endRun(proposal.projectId)
      }
    }
  )
}
