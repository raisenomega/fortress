import type { AgentId } from '@domain/agent/agent'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import { EMPTY_USAGE, type TokenUsage } from '@domain/telemetry/token-usage'

/** Un run individual de un agente, para registrar telemetria por agente (no en bloque). */
export interface StepRun {
  readonly agentId: AgentId
  readonly usage: TokenUsage
  readonly failed: boolean
  readonly durationMs: number
}

/** Lo que produjo una respuesta, con la traza de lo que costo y lo que toco. */
export interface ReplyOutcome {
  readonly text: string
  readonly failed: boolean
  readonly usage: TokenUsage
  readonly tools: readonly string[]
  readonly edits: readonly string[]
  /** Agentes que participaron. De aqui salen los chips del mensaje. */
  readonly agents: readonly AgentId[]
  /** Un run por agente que participo: cada uno con su consumo real. */
  readonly runs: readonly StepRun[]
  /** Hallazgos consolidados del workflow, ya sin repetir. */
  readonly findings: readonly DetectedFinding[]
}

/** Respuesta de solo texto: no hay herramientas ni archivos tocados. */
export function textOnly(text: string, usage: TokenUsage = EMPTY_USAGE): ReplyOutcome {
  return { text, failed: false, usage, tools: [], edits: [], agents: [], runs: [], findings: [] }
}
