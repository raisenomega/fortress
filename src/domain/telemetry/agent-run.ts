import type { AgentId } from '../agent/agent'
import type { TokenUsage } from './token-usage'

/** Que provoco la ejecucion: un mensaje del chat, un escaneo, o una fase del
 *  motor de reparacion (analista, generador o revisor). */
export type RunKind = 'chat' | 'scan' | 'repair'

export interface NewAgentRun {
  readonly projectId: string
  /** Null cuando ningun agente concreto se hizo cargo de la peticion. */
  readonly agentId: AgentId | null
  readonly kind: RunKind
  readonly durationMs: number
  readonly failed: boolean
  readonly usage: TokenUsage
  /** Herramientas usadas, en orden de uso. */
  readonly tools: readonly string[]
}

export interface AgentRun extends NewAgentRun {
  readonly id: string
  readonly at: string
}

/** Acumulado de un agente, para su panel. */
export interface AgentRunTotals {
  readonly runs: number
  readonly failed: number
  readonly edits: number
  readonly usage: TokenUsage
  readonly lastAt: string | null
  readonly lastProjectId: string | null
}

export interface AgentRanking {
  readonly agentId: AgentId
  readonly runs: number
  readonly edits: number
}
