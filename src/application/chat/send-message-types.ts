import type { AgentId } from '@domain/agent/agent'
import type { ChatMessage } from '@domain/chat/chat-message'
import type { ChatEngine } from '@domain/chat/code-agent'
import type { OperationMode } from '@domain/settings/operation-mode'

export interface SendMessageInput {
  readonly projectId: string
  readonly prompt: string
  readonly mode: OperationMode
  /** Agentes que el operador dejo fuera desde el sidebar. */
  readonly excludedAgents: readonly AgentId[]
  /**
   * El hallazgo que el operador mando a resolver desde su fila del Escaneo
   * (ADR-088, pieza 2). Solo el id: el main relee todo lo demas de la base y no
   * se fia de lo que diga el renderer. Sin el, el turno es el de siempre.
   */
  readonly findingId?: string
}

export interface SendMessageOutput {
  readonly user: ChatMessage
  readonly assistant: ChatMessage
  /** Que respondio: el CLI con herramientas reales o solo la API de texto. */
  readonly engine: ChatEngine
}
