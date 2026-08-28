import { ipcMain } from 'electron'
import { retirarPropuesta } from '@application/repair/retirar-propuesta'
import type { Result } from '@domain/shared/result'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

/**
 * La salida de una propuesta viva.
 *
 * A diferencia de los demas canales del motor NO pide `guardRun`, y no es un
 * olvido: esa guardia existe para las corridas de agente —el tope diario y el
 * carril del proyecto—, y retirar no spawnea nada, no gasta un token y no toca
 * el arbol vivo. Mueve una fila a CADUCADO y deja dos asientos. Exigir el carril
 * ademas cerraria la unica salida de una propuesta justo mientras el motor
 * trabaja, que es cuando mas falta hace poder retirar la que estorba.
 *
 * El motivo es opcional y viaja tal cual: el caso de uso ya sabe decir "sin
 * motivo escrito" en vez de inventar una justificacion que nadie dio.
 */
export function registerRepairWithdrawHandler(): void {
  ipcMain.handle(
    IPC.repairWithdraw,
    (_event, proposalId: string, motivo?: string): Promise<Result<null>> =>
      retirarPropuesta(getAppContext(), String(proposalId), motivo ? String(motivo) : undefined)
  )
}
