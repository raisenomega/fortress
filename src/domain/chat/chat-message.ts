import type { AgentId } from '../agent/agent'
import type { ChatEngine } from './code-agent'
import type { OperationMode } from '../settings/operation-mode'

export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  readonly id: string
  /** Cada mensaje pertenece a un proyecto: el historial es por proyecto. */
  readonly projectId: string
  readonly role: ChatRole
  readonly content: string
  /** Agente que produjo la respuesta; null en mensajes del operador. */
  readonly agentId: AgentId | null
  /** Modo vigente cuando se envio el mensaje, para poder auditarlo despues. */
  readonly mode: OperationMode
  /** Si contesto el CLI con herramientas reales o solo la API de texto. */
  readonly engine: ChatEngine
  readonly createdAt: string
  /** Marca los mensajes que aun se estan recibiendo por streaming. */
  readonly pending: boolean
}

export interface NewChatMessage {
  readonly projectId: string
  readonly role: ChatRole
  readonly content: string
  readonly agentId: AgentId | null
  readonly mode: OperationMode
  readonly engine: ChatEngine
}
