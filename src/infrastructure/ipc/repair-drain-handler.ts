import { ipcMain } from 'electron'
import { drenarHastaOmega, type DrenajeResultado } from '@application/repair/drenar-hasta-omega'
import { readLoopBudget } from '@application/settings/read-loop-budget'
import { spentTodayByProject } from '@application/settings/read-budget'
import { getAppContext } from '../persistence/app-context'
import { buildMotorChainDeps } from '../repair/motor-chain-deps'
import { cancelRun, endRun, isCancelled } from '../run-control'
import { guardRun, topeDiarioAlcanzado } from '../run-guard'
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
/** Ni una vuelta: el drenaje ni llego a arrancar. */
// prettier-ignore
const NADA_HECHO = { trabajadas: 0, acumuladas: 0, vetadas: 0, porPresupuesto: 0, porTimeout: 0, porCorrea: 0, porLimitePropio: 0, porEntornoDelProyecto: 0, porDefectoInterno: 0, superadas: 0, sinClasificar: 0 }

export function registerDrainHandlers(): void {
  ipcMain.handle(IPC.repairDrain, async (_event, projectId: string): Promise<DrenajeResultado> => {
    const context = getAppContext()
    const id = String(projectId)
    const busy = guardRun(context, id)
    // `ocupado`, no `averia`: el tope diario, otra corrida en marcha o un
    // proyecto en revision son frenos del sistema haciendo su trabajo. Pintarlos
    // de rojo como una caida hacia que el operador buscara una falla inexistente.
    if (busy !== null) return { ...NADA_HECHO, fin: 'ocupado', detalle: busy }

    // endRun va DESPUES de que el drenaje lea su ultima cancelacion: borra la
    // marca, y borrarla antes le quitaria la razon por la que paro. Y todo lo
    // que se arma va DENTRO: leer el presupuesto o el gasto del dia puede
    // fallar, y fuera ese fallo dejaba el carril tomado hasta reiniciar.
    try {
      const budget = readLoopBudget(context)
      const base = spentTodayByProject(context, new Date(), id)
      const deps = {
        motor: buildMotorChainDeps(id),
        cancelado: () => isCancelled(id),
        gastado: () => spentTodayByProject(context, new Date(), id) - base,
        topeDiario: () => topeDiarioAlcanzado(context, new Date()),
        maxVueltas: budget.maxCycles,
        costCapUsd: budget.costCapUsd
      }
      return await drenarHastaOmega(context, id, deps)
    } finally {
      endRun(id)
    }
  })

  ipcMain.handle(IPC.repairDrainStop, (_event, projectId: string) => cancelRun(String(projectId)))
}
