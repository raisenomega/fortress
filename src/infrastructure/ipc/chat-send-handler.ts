import { ipcMain } from 'electron'
import { sendMessage } from '@application/chat/send-message'
import type { SendMessageInput } from '@application/chat/send-message-types'
import { err, type Result } from '@domain/shared/result'
import { describeAssistantError } from '../ai/describe-error'
import { getAppContext } from '../persistence/app-context'
import { cancelLoop } from '../loop/loop-registry'
import { cancelRun, endRun, isCancelled } from '../run-control'
import { guardRun } from '../run-guard'
import { isFortressRepo } from '../system/self-project'
import { omegaDelTerminal } from '../chat/omega-del-terminal'
import { RED_DE_REVERSION } from '../chat/red-de-reversion'
import { buildChatEngines } from './chat-engines'
import { chunkSender, progressSender } from './chat-send-senders'
import { IPC } from './channels'
import { conFocoSaneado } from './foco-pedido'

export function registerChatSendHandler(): void {
  // Detener TOTAL del proyecto: marca el loop (su espera corta en <=2s) Y corta
  // el proceso vivo con escalada a SIGKILL. Devuelve cuantos corto (Promise<number>).
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
        conFocoSaneado(input),
        chunkSender(event, input.projectId),
        progressSender(event, input.projectId),
        () => isCancelled(input.projectId),
        isFortressRepo,
        RED_DE_REVERSION,
        omegaDelTerminal(input.projectId)
      )
    } catch (error) {
      return err(describeAssistantError(error))
    } finally {
      endRun(input.projectId)
    }
  })
}
