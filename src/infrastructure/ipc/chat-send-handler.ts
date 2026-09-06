import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { sinSecretosEnVivo } from '@application/chat/en-vivo-tachado'
import { sendMessage } from '@application/chat/send-message'
import type { SendMessageInput } from '@application/chat/send-message-types'
import type { StepProgress } from '@application/workflow/step-progress'
import type { ChatChunk, ChatProgress } from '@domain/chat/chat-stream'
import { err, type Result } from '@domain/shared/result'
import { describeAssistantError } from '../ai/describe-error'
import { getAppContext } from '../persistence/app-context'
import { cancelLoop } from '../loop/loop-registry'
import { cancelRun, endRun, isCancelled } from '../run-control'
import { guardRun } from '../run-guard'
import { isFortressRepo } from '../system/self-project'
import { buildChatEngines } from './chat-engines'
import { IPC } from './channels'

/** Solo si la ventana sigue viva, y tachado. `sendMessage` ya envuelve aguas
 *  arriba —ahi cubre a los motores que no pasan por aqui—; se envuelve OTRA VEZ
 *  a proposito, porque tachar es idempotente y una puerta que se protege sola no
 *  depende de que quien la llame se acuerde. */
function chunkSender(event: IpcMainInvokeEvent, projectId: string): (d: string) => void {
  return sinSecretosEnVivo((delta: string): void => {
    if (event.sender.isDestroyed()) return
    const chunk: ChatChunk = { projectId, delta }
    event.sender.send(IPC.chatChunk, chunk)
  })
}

/** Manda el avance del workflow para el medidor en vivo (agentes/tokens/coste). */
function progressSender(event: IpcMainInvokeEvent, projectId: string) {
  return (p: StepProgress): void => {
    if (event.sender.isDestroyed()) return
    const message: ChatProgress = { projectId, ...p }
    event.sender.send(IPC.chatProgress, message)
  }
}

export function registerChatSendHandler(): void {
  // Detener TOTAL del proyecto: marca el loop (si corre, su espera corta en
  // <=2s) Y corta el proceso vivo (chat o loop, con escalada a SIGKILL).
  // Devuelve cuantos corto — el contrato Promise<number> que ChatApi ya promete.
  ipcMain.handle(IPC.chatStop, (_event, projectId: string) => {
    const id = String(projectId)
    cancelLoop(id)
    return cancelRun(id)
  })

  ipcMain.handle(IPC.chatSend, async (event, input: SendMessageInput): Promise<Result<unknown>> => {
    const context = getAppContext()

    // Tope diario y concurrencia, comprobados ANTES de gastar.
    const denegado = guardRun(context, input.projectId)
    if (denegado !== null) return err(denegado)

    // DENTRO del try: armar los motores lee la base y puede fallar, y fuera ese
    // fallo saltaba por encima del `finally` y dejaba el carril TOMADO.
    try {
      const { codeAgent, assistant } = buildChatEngines(context)
      return await sendMessage(
        context,
        assistant,
        codeAgent,
        input,
        chunkSender(event, input.projectId),
        progressSender(event, input.projectId),
        () => isCancelled(input.projectId),
        isFortressRepo
      )
    } catch (error) {
      return err(describeAssistantError(error))
    } finally {
      endRun(input.projectId)
    }
  })
}
