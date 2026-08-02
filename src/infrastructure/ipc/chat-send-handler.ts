import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { sendMessage } from '@application/chat/send-message'
import type { SendMessageInput } from '@application/chat/send-message-types'
import { usesApiKey } from '@application/settings/read-auth-source'
import { readBudget } from '@application/settings/read-budget'
import type { StepProgress } from '@application/workflow/step-progress'
import type { ChatChunk, ChatProgress } from '@domain/chat/chat-stream'
import { err, type Result } from '@domain/shared/result'
import { resolveAssistant } from '../ai/assistant-factory'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { describeAssistantError } from '../ai/describe-error'
import { getAppContext } from '../persistence/app-context'
import { cancelRun, endRun, isCancelled } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'

/** Emite fragmentos solo si la ventana sigue viva (el usuario pudo cerrarla). */
function chunkSender(event: IpcMainInvokeEvent, projectId: string) {
  return (delta: string): void => {
    if (event.sender.isDestroyed()) return
    const chunk: ChatChunk = { projectId, delta }
    event.sender.send(IPC.chatChunk, chunk)
  }
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
  ipcMain.handle(IPC.chatStop, (_event, projectId: string) => cancelRun(projectId))

  ipcMain.handle(IPC.chatSend, async (event, input: SendMessageInput): Promise<Result<unknown>> => {
    const context = getAppContext()

    // Tope diario y concurrencia, comprobados ANTES de gastar.
    const denegado = guardRun(context, input.projectId)
    if (denegado !== null) return err(denegado)

    const budget = readBudget(context)
    const codeAgent = createClaudeCodeAgent(context.apiKeys, budget, usesApiKey(context))
    // Con el CLI instalado no hace falta API key: claude usa sus credenciales.
    const assistant = resolveAssistant(context.apiKeys)

    try {
      return await sendMessage(
        context,
        assistant.ok ? assistant.value : null,
        codeAgent,
        input,
        chunkSender(event, input.projectId),
        progressSender(event, input.projectId),
        () => isCancelled(input.projectId)
      )
    } catch (error) {
      return err(describeAssistantError(error))
    } finally {
      endRun(input.projectId)
    }
  })
}
