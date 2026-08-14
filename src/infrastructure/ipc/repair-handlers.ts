import { ipcMain } from 'electron'
import { planRepair } from '@application/repair/plan-repair'
import { err, ok, type Result } from '@domain/shared/result'
import type { Proposal } from '@domain/repair/proposal'
import { getAppContext } from '../persistence/app-context'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'

export function registerRepairHandlers(): void {
  // C2 spawnea un agente real (read-only): pasa por la misma guardia que
  // cualquier corrida — busy, tope diario y circuit breaker de contaminacion.
  ipcMain.handle(
    IPC.repairPropose,
    async (_event, projectId: string): Promise<Result<Proposal | null>> => {
      const context = getAppContext()
      const id = String(projectId)
      const busy = guardRun(context, id)
      if (busy !== null) return err(busy)
      try {
        return ok(await planRepair(context, id))
      } catch (error) {
        return err(error instanceof Error ? error.message : 'Fallo al proponer la reparacion')
      } finally {
        endRun(id)
      }
    }
  )

  ipcMain.handle(IPC.repairList, (_event, projectId: string) =>
    getAppContext().repairProposals.listByProject(String(projectId))
  )

  ipcMain.handle(IPC.repairGet, (_event, id: string) =>
    getAppContext().repairProposals.findById(String(id))
  )

  // El libro de vida completo de una propuesta, en orden de seq.
  ipcMain.handle(IPC.repairEvents, (_event, proposalId: string) =>
    getAppContext().eventLog.list(String(proposalId))
  )
}
