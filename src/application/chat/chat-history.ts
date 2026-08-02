import type { ChatMessage, NewChatMessage } from '@domain/chat/chat-message'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/** Historial de un proyecto concreto: nunca se mezclan conversaciones. */
export function getHistory(context: AppContext, projectId: string): readonly ChatMessage[] {
  return context.chat.listByProject(projectId)
}

export function appendMessage(context: AppContext, message: NewChatMessage): Result<ChatMessage> {
  if (!context.projects.findById(message.projectId)) {
    return err('No se puede guardar un mensaje de un proyecto que no existe')
  }
  if (message.content.trim().length === 0) {
    return err('El mensaje esta vacio')
  }

  return ok(context.chat.add(message))
}

export function clearHistory(context: AppContext, projectId: string): void {
  context.chat.clearProject(projectId)
}
