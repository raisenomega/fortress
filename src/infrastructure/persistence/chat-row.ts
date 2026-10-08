import type { AgentId } from '@domain/agent/agent'
import type { ChatMessage, ChatRole } from '@domain/chat/chat-message'
import type { ChatEngine } from '@domain/chat/code-agent'
import type { OperationMode } from '@domain/settings/operation-mode'

export interface ChatRow {
  readonly id: string
  readonly project_id: string | null
  readonly chat_id: string | null
  readonly role: string
  readonly content: string
  readonly agent_id: string | null
  readonly mode: string
  readonly engine: string
  readonly created_at: string
}

/** Lo persistido nunca esta en curso: `pending` es estado de streaming en la UI. */
export function toChatMessage(row: ChatRow): ChatMessage {
  return {
    id: row.id,
    // El '' solo puede venir de un hilo LIBRE (project_id NULL): B1 lo pinta.
    projectId: row.project_id ?? '',
    chatId: row.chat_id,
    role: row.role as ChatRole,
    content: row.content,
    agentId: row.agent_id as AgentId | null,
    mode: row.mode as OperationMode,
    engine: row.engine as ChatEngine,
    createdAt: row.created_at,
    pending: false
  }
}
