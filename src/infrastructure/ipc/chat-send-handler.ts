import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import type { SendMessageInput } from '@application/chat/send-message-types'
import { err, type Result } from '@domain/shared/result'
import { describeAssistantError } from '../ai/describe-error'
import { getAppContext } from '../persistence/app-context'
import { cancelLoop } from '../loop/loop-registry'
import { cancelRun, endRun } from '../run-control'
import { gastarAprobacion } from '../aprobacion-del-plan'
import { guardBarrera } from '../barrera-guard'
import { guardPlanAprobado } from '../plan-guard'
import { guardRun } from '../run-guard'
import { IPC } from './channels'
import { turnoConJuicio } from './turno-con-juicio'

/**
 * Las dos puertas del envio, y detras el turno. Vive AQUI —junto al registro— y
 * no en `turno-con-juicio` porque quien lee este fichero para saber que protege
 * `chat:send` tiene que verlo sin saltar de archivo, y porque `guards-del-codigo`
 * solo sigue ayudantes del MISMO fichero: sacarlas cegaria a la tabla de
 * docs/IPC.md sobre el unico canal que mas turno toma.
 */
async function atenderEnvio(
  event: IpcMainInvokeEvent,
  input: SendMessageInput
): Promise<Result<unknown>> {
  const context = getAppContext()
  // PRE-VUELO. La PRIMERA de las tres: asienta la observacion pase lo que pase
  // despues, y en autonomo niega el lote si la barrera del proyecto esta muerta.
  const rota = guardBarrera(context, input)
  if (rota !== null) return err(rota)

  // Tope diario y concurrencia, comprobados ANTES de gastar.
  // ADR-097 §4: en autonomo, un hallazgo del lote no corre sin el ADELANTE de
  // OMEGA. Aqui y no en el renderer: quien ejecuta es este proceso. Y ANTES de
  // `guardRun`, que RESERVA el carril: negar despues de reservar lo dejaria
  // tomado para siempre (`carril-se-suelta`).
  const sinAprobar = guardPlanAprobado(context, input)
  if (sinAprobar !== null) return err(sinAprobar)

  const denegado = guardRun(context, input.projectId)
  if (denegado !== null) return err(denegado)

  // (b) El permiso se GASTA aqui, con las dos puertas ya pasadas: el mismo
  // hallazgo no corre dos veces con una sola aprobacion. DESPUES de `guardRun`
  // y no antes — gastarlo y que el carril lo deniegue quemaria un permiso por
  // un turno que no llego a existir.
  if (input.findingId !== undefined) gastarAprobacion(input.projectId, input.findingId)

  // DENTRO del try: armar los motores lee la base y puede fallar, y fuera ese
  // fallo saltaba por encima del `finally` y dejaba el carril TOMADO.
  try {
    return await turnoConJuicio(context, input, event)
  } catch (error) {
    return err(describeAssistantError(error))
  } finally {
    endRun(input.projectId)
  }
}

export function registerChatSendHandler(): void {
  // Detener TOTAL del proyecto: marca el loop (su espera corta en <=2s) Y corta
  // el proceso vivo con escalada a SIGKILL. Devuelve cuantos corto (Promise<number>).
  ipcMain.handle(IPC.chatStop, (_event, projectId: string) => {
    const id = String(projectId)
    cancelLoop(id)
    return cancelRun(id)
  })

  // Se LLAMA, no se pasa por referencia: `guards-del-codigo` busca `ayudante(`
  // dentro del registro para seguirle la pista, y `, atenderEnvio)` no lo es.
  ipcMain.handle(IPC.chatSend, (event, input: SendMessageInput) => atenderEnvio(event, input))
}
