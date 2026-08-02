import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { sendMessage } from '@application/chat/send-message'
import type { SendMessageInput } from '@application/chat/send-message-types'
import type { ChatChunk } from '@domain/chat/chat-stream'
import { err, type Result } from '@domain/shared/result'
import { resolveAssistant } from '../ai/assistant-factory'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
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
    const codeAgent = createClaudeCodeAgent(context.apiKeys)
    // Con el CLI instalado no hace falta API key: claude usa sus credenciales.
    const assistant = resolveAssistant(context.apiKeys)

    try {
      return await sendMessage(
        context,
        assistant.ok ? assistant.value : null,
        codeAgent,
        input,
        chunkSender(event, input.projectId),
        (index, total) => chunkSender(event, input.projectId)(`\n· paso ${index + 1}/${total}\n`)
      )
    } catch (error) {
      return err(describeAssistantError(error))
    }
  })
}
