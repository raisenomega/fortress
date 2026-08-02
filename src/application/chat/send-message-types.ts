import type { AgentId } from '@domain/agent/agent'
import type { ChatMessage } from '@domain/chat/chat-message'
import type { ChatEngine } from '@domain/chat/code-agent'
import type { OperationMode } from '@domain/settings/operation-mode'

export interface SendMessageInput {
  readonly projectId: string
  readonly prompt: string
  readonly mode: OperationMode
  readonly enabledAgents: readonly AgentId[]
}

export interface SendMessageOutput {
  readonly user: ChatMessage
  readonly assistant: ChatMessage
  /** Que respondio: el CLI con herramientas reales o solo la API de texto. */
  readonly engine: ChatEngine
}
