import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { sendMessage } from '@application/chat/send-message'
import type { SendMessageInput } from '@application/chat/send-message-types'
import type { ChatChunk } from '@domain/chat/chat-stream'
import { err, type Result } from '@domain/shared/result'
import { resolveAssistant } from '../ai/assistant-factory'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { describeAssistantError } from '../ai/describe-error'
import { usesApiKey } from '@application/settings/read-auth-source'
import { readBudget, spentToday } from '@application/settings/read-budget'
import { dayLimitReached } from '@domain/settings/run-budget'
import { getAppContext } from '../persistence/app-context'
import { beginRun, cancelRun, endRun, isCancelled } from '../run-control'
import { IPC } from './channels'

/** Emite fragmentos solo si la ventana sigue viva (el usuario pudo cerrarla). */
function chunkSender(event: IpcMainInvokeEvent, projectId: string) {
  return (delta: string): void => {
    if (event.sender.isDestroyed()) return
    const chunk: ChatChunk = { projectId, delta }
    event.sender.send(IPC.chatChunk, chunk)
  }
}

export function registerChatSendHandler(): void {
  ipcMain.handle(IPC.chatStop, (_event, projectId: string) => cancelRun(projectId))

  ipcMain.handle(IPC.chatSend, async (event, input: SendMessageInput): Promise<Result<unknown>> => {
    const context = getAppContext()
    const budget = readBudget(context)

    // El tope diario se comprueba ANTES de gastar: avisar despues no sirve.
    const limite = dayLimitReached(budget, spentToday(context, new Date()))
    if (limite !== null) return err(limite)

    const codeAgent = createClaudeCodeAgent(context.apiKeys, budget, usesApiKey(context))
    // Con el CLI instalado no hace falta API key: claude usa sus credenciales.
    const assistant = resolveAssistant(context.apiKeys)

    beginRun(input.projectId)

    try {
      return await sendMessage(
        context,
        assistant.ok ? assistant.value : null,
        codeAgent,
        input,
        chunkSender(event, input.projectId),
        (index, total) => chunkSender(event, input.projectId)(`\n· paso ${index + 1}/${total}\n`),
        () => isCancelled(input.projectId)
      )
    } catch (error) {
      return err(describeAssistantError(error))
    } finally {
      endRun(input.projectId)
    }
  })
}
