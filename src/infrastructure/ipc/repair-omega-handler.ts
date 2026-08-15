import { ipcMain } from 'electron'
import { judgeAndIntegrate } from '@application/repair/judge-and-integrate'
import type { RunOmegaResult } from '@application/repair/run-omega'
import { getAppContext } from '../persistence/app-context'
import { buildAutoMergeDeps, buildOmegaDeps } from '../repair/repair-deps'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'

/**
 * I4 — OMEGA gasta modelo (lectura estricta): misma guardia por-proyecto que
 * toda corrida, y la cola de juicio (compartida con el gate) dentro de runOmega.
 *
 * El juicio y la integracion van DENTRO del guard: integrar es escribir en el
 * repo vivo, y dejarlo fuera abriria la ventana justo donde otra corrida podria
 * empezar. Lo que DECIDE si se integra vive en la capa de aplicacion; aqui solo
 * se arman las dependencias reales y se sostiene el carril del proyecto.
 *
 * El caso de uso informa de las dos cosas que hace; por el puente viaja solo el
 * juicio. La adaptacion vive aqui, en la frontera con el transporte, y no
 * empobreciendo el retorno de dentro para que quepa en el contrato de fuera.
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
        const deps = { omega: buildOmegaDeps(), autoMerge: buildAutoMergeDeps() }
        return (await judgeAndIntegrate(context, proposal.id, deps)).omega
      } finally {
        endRun(proposal.projectId)
      }
    }
  )
}
