import { newId } from '../shared/id'
import type { ProposalState } from './proposal'

/** Fase del ciclo de vida a la que pertenece un evento. */
export type EventPhase =
  'SELECT' | 'ANALYZE' | 'GENERATE' | 'GATE' | 'OMEGA' | 'APPROVE' | 'MERGE' | 'EXPIRE'
export type EventType = 'TRANSITION' | 'AGENT_RUN' | 'DECISION' | 'ERROR'
export type Actor = 'motor' | 'claude-analyst' | 'gate' | 'omega' | 'human'

/**
 * Un eslabon del libro de vida de una propuesta: quien hizo que, cuando, con
 * que coste y por que. Telemetria PARALELA a la maquina de estados: registra,
 * no valida — canTransition sigue siendo el unico juez de las transiciones.
 */
export interface ProposalEvent {
  readonly id: string
  readonly proposalId: string
  /** Posicion en la cadena (1..n). El repositorio exige monotonia. */
  readonly seq: number
  readonly phase: EventPhase
  readonly eventType: EventType
  readonly fromState?: ProposalState
  readonly toState?: ProposalState
  readonly actor: Actor
  readonly agentRunId?: string
  readonly scanId?: string
  readonly reason?: string
  readonly costTokens?: number
  readonly durationMs?: number
  readonly evidenceJson?: string
  readonly ts: number
}

export interface TransitionInput {
  readonly proposalId: string
  readonly seq: number
  readonly phase: EventPhase
  readonly toState: ProposalState
  readonly fromState?: ProposalState
  readonly scanId?: string
  readonly reason?: string
  readonly evidenceJson?: string
  readonly ts: number
}

/** Evento de cambio de estado: siempre lo asienta el motor. */
export function buildTransitionEvent(input: TransitionInput): ProposalEvent {
  return { id: newId(), eventType: 'TRANSITION', actor: 'motor', ...input }
}

export interface AgentRunInput {
  readonly proposalId: string
  readonly seq: number
  readonly phase: EventPhase
  readonly actor: Actor
  readonly agentRunId?: string
  readonly costTokens?: number
  readonly durationMs?: number
  readonly reason?: string
  readonly ts: number
}

/** Corrida de un agente dentro de una fase, con su coste si se conoce. */
export function buildAgentRunEvent(input: AgentRunInput): ProposalEvent {
  return { id: newId(), eventType: 'AGENT_RUN', ...input }
}
