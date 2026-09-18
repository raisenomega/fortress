import type { AgentId } from '@domain/agent/agent'
import type { ChatMessage } from '@domain/chat/chat-message'
import type { ChatEngine } from '@domain/chat/code-agent'
import type { SinCierre } from '@domain/chat/motivo-sin-cierre'
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
  /**
   * Los hallazgos del LOTE (ADR-088, arco 1). Sin `findingId` es el turno de
   * PLAN: el productor los ve todos y propone su orden. Con `findingId` son los
   * HERMANOS, solo contexto. Nunca sustituye al foco, que sigue siendo UNO.
   */
  readonly lote?: readonly string[]
}

export interface SendMessageOutput {
  readonly user: ChatMessage
  readonly assistant: ChatMessage
  /** Que respondio: el CLI con herramientas reales o solo la API de texto. */
  readonly engine: ChatEngine
  /** La guarda que corto el cierre del ciclo, o null si no habia que cerrar o
   *  se cerro. Enum y numeros: cruza el puente sin llevar nada del proyecto. */
  readonly sinCierre: SinCierre | null
  /** El turno se conservo SIN que nadie pudiera compilar el proyecto (ADR-091).
   *  Un booleano: cruza el puente sin llevar nada del codigo del cliente. */
  readonly sinVerificar: boolean
}
