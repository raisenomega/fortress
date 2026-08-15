import type { SelfNoteDraft } from '../system/self-observation'
import type { TokenUsage } from '../telemetry/token-usage'
import type { Candidate } from './select-target'

/**
 * Entendimiento INERTE de un hallazgo: que cambiar, donde, que patron copiar, que NO
 * tocar y el riesgo. Es el borrador del ENTENDIMIENTO (C2), no el del fix (C3).
 */
export interface Analysis {
  readonly target: Candidate
  /** Veredicto verificado contra el archivo real: "REAL" (accionable) u "OBSOLETO". */
  readonly status: string
  readonly whatToChange: string
  readonly where: string
  /** El patron a copiar y de donde (guardRun en scan-handlers/quality-handlers). */
  readonly patternToCopy: string
  readonly doNotTouch: string
  readonly risk: string
  /** Tokens que costo el analisis (grafo-primero deberia ser barato). */
  readonly tokensUsed: number
  /**
   * Lo que el analista noto de FORTRESS MISMA mientras estudiaba el hallazgo:
   * una herramienta que le falto, un permiso que le corto, algo que le habria
   * ayudado. No es del proyecto auditado; es material para que FORTRESS madure.
   */
  readonly notes?: readonly SelfNoteDraft[]
}

/** COMPLETO (listo para C3) si todas las partes de prosa tienen contenido. */
export function isComplete(a: Analysis): boolean {
  return [a.whatToChange, a.where, a.patternToCopy, a.doNotTouch, a.risk].every(
    (part) => part.trim().length > 0
  )
}

/** REAL y accionable (no obsoleto): C3 solo debe proponer sobre esto. */
export function isActionable(a: Analysis): boolean {
  return a.status.trim().toUpperCase() === 'REAL'
}

/** Metadatos de la corrida del analista: lo que costo y cuanto tardo. */
export interface AnalystRunMeta {
  /** Id en agent_runs, si la corrida se registro alli (hoy no: deuda anotada). */
  readonly agentRunId?: string
  /** undefined si el parser no pudo extraerlo: no se inventan numeros. */
  readonly tokensUsed?: number
  /**
   * La factura entera del CLI, no solo su suma. `tokensUsed` sigue siendo el
   * total que gobierna el tope por propuesta; esto es lo que hace falta para
   * asentar la corrida en el libro mayor, que guarda los cuatro contadores
   * separados porque el cache no cuesta lo mismo que el input normal.
   */
  readonly usage?: TokenUsage
  readonly durationMs: number
  readonly model?: string
  readonly startedAt: number
  readonly endedAt: number
}

/** El entendimiento MAS su factura: el analisis nunca viaja sin su coste. */
export interface AnalystResult {
  readonly analysis: Analysis
  readonly runMeta: AnalystRunMeta
}

/** Puerto: el analista grafo-primero que ESTUDIA el hallazgo. Infra lo implementa. */
export interface Analyst {
  study(target: Candidate): Promise<AnalystResult>
}
