import type { AgentId } from '@domain/agent/agent'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import { EMPTY_USAGE, type TokenUsage } from '@domain/telemetry/token-usage'

/** Un run individual de un agente, para registrar telemetria por agente (no en bloque). */
export interface StepRun {
  readonly agentId: AgentId
  readonly usage: TokenUsage
  readonly failed: boolean
  readonly durationMs: number
  /** Herramientas del agente, en orden. Persiste el uso del grafo por agente. */
  readonly tools: readonly string[]
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
  /** True solo tras una auditoria integral (todas las dimensiones): fija la calidad general. */
  readonly comprehensive?: boolean
  /** Los NOMBRES de las herramientas que el modo de permisos bloqueo. Viajan
   *  como DATO —no como la nota de texto que ya lleva `text`— porque de ellos
   *  sale lo que FORTRESS aprende de si misma (ADR-085). */
  readonly deniedTools?: readonly string[]
  /** La sesion del CLI que merece recordarse, si la hay (ADR-088, Enmienda 2). */
  readonly sesion?: string
  /** La sesion que se pidio reanudar ya no existe: hay que olvidarla (Garantia 2). */
  readonly sesionRota?: boolean
}

/** Respuesta de solo texto: no hay herramientas ni archivos tocados. */
export function textOnly(text: string, usage: TokenUsage = EMPTY_USAGE): ReplyOutcome {
  return { text, failed: false, usage, tools: [], edits: [], agents: [], runs: [], findings: [] }
}
