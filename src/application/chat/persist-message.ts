import type { AgentId } from '@domain/agent/agent'
import type { ChatEngine } from '@domain/chat/code-agent'
import type { ChatMessage } from '@domain/chat/chat-message'
import type { OperationMode } from '@domain/settings/operation-mode'
import type { Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { appendMessage } from './chat-history'

export interface MessageMeta {
  readonly mode: OperationMode
  readonly engine: ChatEngine
}

/**
 * Persiste un turno del chat. Compartido entre el flujo normal y el de
 * configuracion; el guard de "mensaje vacio" y "proyecto inexistente" lo pone
 * appendMessage.
 */
export function persistTurn(
  context: AppContext,
  projectId: string,
  meta: MessageMeta,
  role: 'user' | 'assistant',
  content: string,
  agentId: AgentId | null
): Result<ChatMessage> {
  return appendMessage(context, { projectId, role, content, agentId, ...meta })
}
