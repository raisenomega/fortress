import type { AgentId } from '@domain/agent/agent'
import type { ChatMessage, ChatRole } from '@domain/chat/chat-message'
import type { OperationMode } from '@domain/settings/operation-mode'

export interface ChatRow {
  readonly id: string
  readonly project_id: string
  readonly role: string
  readonly content: string
  readonly agent_id: string | null
  readonly mode: string
  readonly created_at: string
}

/** Lo persistido nunca esta en curso: `pending` es estado de streaming en la UI. */
export function toChatMessage(row: ChatRow): ChatMessage {
  return {
    id: row.id,
    projectId: row.project_id,
    role: row.role as ChatRole,
    content: row.content,
    agentId: row.agent_id as AgentId | null,
    mode: row.mode as OperationMode,
    createdAt: row.created_at,
    pending: false
  }
}
