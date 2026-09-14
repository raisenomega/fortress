import { ipcMain } from 'electron'
import type { AppContext } from '@application/context'
import { recorrerVerificaciones } from '@application/repair/recorrer-verificaciones'
import type { VerificacionMasivaDeps } from '@application/repair/recorrer-verificaciones'
import { verificarTodos } from '@application/repair/verificar-todos'
// prettier-ignore
import { NADA_VERIFICADO, type ResultadoVerificacionMasiva } from '@domain/repair/verificacion-masiva'
import { getAppContext } from '../persistence/app-context'
import { avisarDelMotor } from '../repair/aviso-del-motor'
import { cancelRun, endRun, isCancelled } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'
import { idsPedidos } from './ids-pedidos'

type Barrido = (c: AppContext, d: VerificacionMasivaDeps) => Promise<ResultadoVerificacionMasiva>

/**
 * El carril de un barrido, compartido por sus DOS puertas: «todos los mitigados»
 * y «los que elegi». Lo unico que las distingue es quien arma la lista.
 *
 * UN SOLO `guardRun` PARA TODO EL BARRIDO, que es la leccion de `scan-handlers`:
 * las XX paradas son un solo trabajo, y trocearlo dejaria colar otra corrida
 * entre dos de ellas. Verificar de una en una toma y suelta el carril por
 * hallazgo; con veintiseis, eso son veintiseis huecos.
 *
 * Y con el carril viene el TOPE DIARIO, que `guardRun` cobra en la puerta antes
 * de gastar un token: el unico freno de dinero del gesto, porque dentro del
 * bucle no hay ninguno. Vive en este fichero y no en uno de `repair/` para que
 * el turno se lea donde se registra el canal — es lo que deja comprobar que la
 * columna «Guards» de docs/IPC.md no miente.
 */
async function barrerConTurno(
  projectId: string,
  barrido: Barrido
): Promise<ResultadoVerificacionMasiva> {
  // prettier-ignore
  const context = getAppContext()
  const id = String(projectId)
  const busy = guardRun(context, id)
  // `ocupado` no es un error: es un freno del sistema haciendo su trabajo, y
  // pintarlo de rojo manda a buscar una averia inexistente.
  if (busy !== null) return { ...NADA_VERIFICADO, total: 0, fin: 'ocupado', detalle: busy }

  // endRun va DESPUES de que el barrido lea su ultima cancelacion: borra la
  // marca, y borrarla antes le quitaria la razon por la que paro.
  try {
    return await barrido(context, { cancelado: () => isCancelled(id), avisar: () => avisarDelMotor(id) }) // prettier-ignore
  } finally {
    endRun(id)
  }
}

/** Las dos puertas del barrido (ADR-087, Fase 3) y su Detener, que es uno solo
 *  porque detras hay un unico carril por proyecto. */
export function registerFindingVerifyAllHandler(): void {
  ipcMain.handle(IPC.findingVerifyAll, (_e, projectId: string) =>
    barrerConTurno(String(projectId), (c, d) => verificarTodos(c, String(projectId), d))
  )

  ipcMain.handle(IPC.findingVerifySelected, (_e, projectId: string, ids: unknown) =>
    barrerConTurno(String(projectId), (c, d) =>
      recorrerVerificaciones(c, String(projectId), idsPedidos(ids), d)
    )
  )

  ipcMain.handle(IPC.findingVerifyAllStop, (_e, projectId: string) => cancelRun(String(projectId)))
}
