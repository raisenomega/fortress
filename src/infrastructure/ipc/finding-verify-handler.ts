import { ipcMain } from 'electron'
import { verificarMitigado } from '@application/repair/verificar-mitigado'
import type { DictamenDeVerificacion } from '@domain/repair/dictamen-de-verificacion'
import { err, ok, type Result } from '@domain/shared/result'
import { getAppContext } from '../persistence/app-context'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'

/**
 * El operador pide comprobar que su arreglo cerro un hallazgo (ADR-087).
 *
 * Pasa por `guardRun` como cualquier corrida: verificar spawnea un agente real y
 * dos agentes sobre el mismo proyecto se pisan. Consecuencia asumida y no
 * maquillada: verificar es de una en una, y la pantalla lo ensena.
 *
 * Fichero propio y no dentro de `repair-handlers`: aquello registra el ciclo de
 * la PROPUESTA —proponer, generar, firmar, drenar— y esto no crea ninguna. Se
 * registra desde alli por el limite de 75 lineas, como los otros cuatro.
 */
export function registerFindingVerifyHandler(): void {
  ipcMain.handle(
    IPC.findingVerify,
    async (
      _event,
      projectId: string,
      findingId: string
    ): Promise<Result<DictamenDeVerificacion | null>> => {
      const context = getAppContext()
      const id = String(projectId)
      const busy = guardRun(context, id)
      if (busy !== null) return err(busy)
      try {
        return ok(await verificarMitigado(context, id, String(findingId)))
      } catch (error) {
        return err(error instanceof Error ? error.message : 'Fallo al verificar el hallazgo')
      } finally {
        endRun(id)
      }
    }
  )
}
