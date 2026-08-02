import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { sendMessage, type SendMessageInput } from '@application/chat/send-message'
import type { ChatChunk } from '@domain/chat/chat-stream'
import { err, type Result } from '@domain/shared/result'
import { resolveAssistant } from '../ai/assistant-factory'
import { describeAssistantError } from '../ai/describe-error'
import { getAppContext } from '../persistence/app-context'
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
  ipcMain.handle(IPC.chatSend, async (event, input: SendMessageInput): Promise<Result<unknown>> => {
    const context = getAppContext()
    const assistant = resolveAssistant(context.apiKeys)
    if (!assistant.ok) return assistant

    try {
      return await sendMessage(context, assistant.value, input, chunkSender(event, input.projectId))
    } catch (error) {
      return err(describeAssistantError(error))
    }
  })
}
