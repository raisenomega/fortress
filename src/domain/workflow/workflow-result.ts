import type { AgentId } from '../agent/agent'
import type { DetectedFinding } from '../scan/detected-finding'
import { fingerprintOf } from '../project/finding-fingerprint'
import type { TokenUsage } from '../telemetry/token-usage'

export interface StepResult {
  readonly agentId: AgentId
  readonly text: string
  readonly findings: readonly DetectedFinding[]
  /**
   * Falso si el agente no devolvio el bloque de informe. No es lo mismo que
   * "no encontro nada": se dice en el reporte en vez de contarlo como limpio.
   */
  readonly reportRead: boolean
  readonly failed: boolean
  readonly usage: TokenUsage
  /** Lo que tardo ESTE paso, para atribuir tiempo por agente y no en bloque. */
  readonly durationMs: number
}

export interface WorkflowOutcome {
  readonly results: readonly StepResult[]
  /** Agente cuya puerta detuvo el workflow, si alguno lo hizo. */
  readonly stoppedBy: AgentId | null
}

/** Hallazgo con el agente que lo reporto: sin esto el informe no sabe de quien
 *  es cada linea, y un hallazgo de Cognition parecia venir de Code Reviewer. */
export interface AttributedFinding extends DetectedFinding {
  readonly agentId: AgentId
}

/**
 * Hallazgos de todos los pasos, sin repetir y con su autor. Dos agentes pueden
 * ver el mismo problema y describirlo casi igual; la huella los colapsa y el
 * merito queda del primero que lo vio, no repartido ni mal atribuido.
 */
export function consolidate(results: readonly StepResult[]): readonly AttributedFinding[] {
  const seen = new Set<string>()
  const unicos: AttributedFinding[] = []

  for (const result of results) {
    for (const finding of result.findings) {
      const print = fingerprintOf(finding)
      if (seen.has(print)) continue
      seen.add(print)
      unicos.push({ ...finding, agentId: result.agentId })
    }
  }

  return unicos
}

/** Agentes que llegaron a participar de verdad. De aqui salen los chips. */
export function participants(results: readonly StepResult[]): readonly AgentId[] {
  return [...new Set(results.map((result) => result.agentId))]
}

/** Pasos que no devolvieron informe legible: hay que decirlo, no ocultarlo. */
export function unreadable(results: readonly StepResult[]): readonly AgentId[] {
  return results.filter((result) => !result.reportRead).map((result) => result.agentId)
}
