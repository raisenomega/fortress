import { ipcMain } from 'electron'
import { planRepair } from '@application/repair/plan-repair'
import type { PlanResult } from '@application/repair/resultado-del-plan'
import { resumenCerco } from '@application/repair/resumen-cerco'
import { err, ok, type Result } from '@domain/shared/result'
import { getAppContext } from '../persistence/app-context'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'
import { registerDrainHandlers } from './repair-drain-handler'
import { registerFindingVerifyHandler } from './finding-verify-handler'
import { registerFindingVerifyAllHandler } from './finding-verify-all-handler'
import { registerSignHandler } from './repair-sign-handler'
import { registerTandaHandlers } from './repair-tanda-handler'

export function registerRepairHandlers(): void {
  registerSignHandler()
  registerTandaHandlers()
  registerDrainHandlers()
  registerFindingVerifyHandler()
  registerFindingVerifyAllHandler()
  // C2 spawnea un agente real (read-only): pasa por la misma guardia que
  // cualquier corrida — busy, tope diario y circuit breaker de contaminacion.
  //
  // El segundo argumento es OPCIONAL y cambia quien elige: con el, el operador
  // ya senalo el hallazgo y el motor lo atiende; sin el, elige la cola. Un
  // llamador que no lo pase recibe el comportamiento de siempre.
  ipcMain.handle(
    IPC.repairPropose,
    async (_event, projectId: string, findingId?: string): Promise<Result<PlanResult>> => {
      const context = getAppContext()
      const id = String(projectId)
      const dirigido = findingId === undefined ? undefined : String(findingId)
      const busy = guardRun(context, id)
      if (busy !== null) return err(busy)
      try {
        return ok(await planRepair(context, id, dirigido))
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

  ipcMain.handle(IPC.repairCerco, (_event, projectId: string) =>
    resumenCerco(getAppContext(), String(projectId))
  )

  ipcMain.handle(IPC.repairGet, (_event, id: string) =>
    getAppContext().repairProposals.findById(String(id))
  )

  // El libro de vida completo de una propuesta, en orden de seq.
  ipcMain.handle(IPC.repairEvents, (_event, proposalId: string) =>
    getAppContext().eventLog.list(String(proposalId))
  )
}
