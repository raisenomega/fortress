import { ipcMain } from 'electron'
import { verificarTodos } from '@application/repair/verificar-todos'
// prettier-ignore
import { NADA_VERIFICADO, type ResultadoVerificacionMasiva } from '@domain/repair/verificacion-masiva'
import { getAppContext } from '../persistence/app-context'
import { avisarDelMotor } from '../repair/aviso-del-motor'
import { cancelRun, endRun, isCancelled } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'

/** Ni un mitigado: el barrido ni llego a arrancar. */
const NADA_HECHO = { ...NADA_VERIFICADO, total: 0 }

/**
 * El barrido de mitigados, con la forma del ESCANEO (ADR-087, Fase 3).
 *
 * UN SOLO `guardRun` PARA TODO EL BARRIDO, y es la leccion de `scan-handlers`:
 * las XX paradas son un solo trabajo, y trocearlo dejaria colar otra corrida
 * entre dos de ellas. Verificar de una en una toma y suelta el carril por
 * hallazgo; con 26, eso son 26 huecos. Aqui se toma una vez y se suelta una vez.
 *
 * Y con el carril viene el TOPE DIARIO, que `guardRun` cobra en la puerta antes
 * de gastar un token. Es el unico freno de dinero que este gesto tiene, por
 * decision: dentro del bucle no hay ninguno.
 *
 * Devuelve el parte crudo y no un `Result` —como el drenaje y a diferencia de la
 * verificacion suelta— porque `ocupado` no es un error: es un freno del sistema
 * haciendo su trabajo, y pintarlo de rojo manda a buscar una averia inexistente.
 */
export function registerFindingVerifyAllHandler(): void {
  ipcMain.handle(
    IPC.findingVerifyAll,
    async (_event, projectId: string): Promise<ResultadoVerificacionMasiva> => {
      const context = getAppContext()
      const id = String(projectId)
      const busy = guardRun(context, id)
      if (busy !== null) return { ...NADA_HECHO, fin: 'ocupado', detalle: busy }

      // endRun va DESPUES de que el barrido lea su ultima cancelacion: borra la
      // marca, y borrarla antes le quitaria la razon por la que paro.
      try {
        return await verificarTodos(context, id, {
          cancelado: () => isCancelled(id),
          avisar: () => avisarDelMotor(id)
        })
      } finally {
        endRun(id)
      }
    }
  )

  // Detener: marca la cancelacion y mata al analista en curso. El barrido la lee
  // en la frontera del SIGUIENTE mitigado, y tambien al volver de este.
  ipcMain.handle(IPC.findingVerifyAllStop, (_event, projectId: string) =>
    cancelRun(String(projectId))
  )
}
