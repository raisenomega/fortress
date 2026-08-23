import { ipcMain } from 'electron'
import { drenarHastaOmega, type DrenajeResultado } from '@application/repair/drenar-hasta-omega'
import { readLoopBudget } from '@application/settings/read-loop-budget'
import { spentTodayByProject } from '@application/settings/read-budget'
import { getAppContext } from '../persistence/app-context'
import { buildMotorChainDeps } from '../repair/motor-chain-deps'
import { cancelRun, endRun, isCancelled } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'

/**
 * El drenaje desde la pagina del motor: recorre los elegibles y los deja
 * juzgados esperando firma. Nada llega al repo por aqui — para eso esta
 * `repair:sign`, que es la unica puerta.
 *
 * Reusa los topes del loop a proposito: es el mismo dinero y el mismo bolsillo,
 * y dos juegos de frenos para la misma cara serian dos sitios donde olvidarse
 * de subir uno.
 */
export function registerDrainHandlers(): void {
  ipcMain.handle(IPC.repairDrain, async (_event, projectId: string): Promise<DrenajeResultado> => {
    const context = getAppContext()
    const id = String(projectId)
    const busy = guardRun(context, id)
    if (busy !== null) return { fin: 'averia', acumuladas: 0, detalle: busy }

    const budget = readLoopBudget(context)
    const base = spentTodayByProject(context, new Date(), id)
    const deps = {
      motor: buildMotorChainDeps(id),
      cancelado: () => isCancelled(id),
      gastado: () => spentTodayByProject(context, new Date(), id) - base,
      maxVueltas: budget.maxCycles,
      costCapUsd: budget.costCapUsd
    }
    // endRun va DESPUES de que el drenaje lea su ultima cancelacion: borra la
    // marca, y borrarla antes le quitaria la razon por la que paro.
    try {
      return await drenarHastaOmega(context, id, deps)
    } finally {
      endRun(id)
    }
  })

  ipcMain.handle(IPC.repairDrainStop, (_event, projectId: string) => cancelRun(String(projectId)))
}
