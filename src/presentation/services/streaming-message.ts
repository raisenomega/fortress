import type { ChatMessage } from '@domain/chat/chat-message'
import type { OperationMode } from '@domain/settings/operation-mode'
import { newId, nowIso } from '@domain/shared/id'

/**
 * Mensajes optimistas que se pintan mientras dura el streaming. Al terminar se
 * recarga el historial desde SQLite, que es la fuente de verdad.
 */
export function draftUserMessage(
  projectId: string,
  content: string,
  mode: OperationMode
): ChatMessage {
  return {
    id: newId(),
    projectId,
    role: 'user',
    content,
    agentId: null,
    mode,
    createdAt: nowIso(),
    pending: false
  }
}

export function draftAssistantMessage(projectId: string, mode: OperationMode): ChatMessage {
  return {
    id: newId(),
    projectId,
    role: 'assistant',
    content: '',
    agentId: null,
    mode,
    createdAt: nowIso(),
    pending: true
  }
}
