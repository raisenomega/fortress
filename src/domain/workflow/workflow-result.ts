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
}

export interface WorkflowOutcome {
  readonly results: readonly StepResult[]
  /** Agente cuya puerta detuvo el workflow, si alguno lo hizo. */
  readonly stoppedBy: AgentId | null
}

/**
 * Hallazgos de todos los pasos, sin repetir. Dos agentes pueden ver el mismo
 * problema desde angulos distintos y describirlo casi igual; la huella los
 * colapsa para que el informe no cuente dos veces lo mismo.
 */
export function consolidate(results: readonly StepResult[]): readonly DetectedFinding[] {
  const seen = new Set<string>()
  const unicos: DetectedFinding[] = []

  for (const result of results) {
    for (const finding of result.findings) {
      const print = fingerprintOf(finding)
      if (seen.has(print)) continue
      seen.add(print)
      unicos.push(finding)
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
