/**
 * Salud de un agente con datos REALES de sus ejecuciones (telemetria). Sin
 * "mentiras", "profundidad" ni percentiles inventados: solo lo que el sistema
 * mide de verdad. La veracidad (hallazgos vs disco) vive en la puntuacion,
 * porque solo aplica al agente que escanea.
 */
export interface AgentHealth {
  readonly agentId: string
  readonly name: string
  readonly runs: number
  readonly failed: number
  /** % de ejecuciones sin fallo, o null si el agente no ha corrido. */
  readonly compliance: number | null
  readonly outputTokens: number
  /** Tokens de salida por ejecucion (dato de eficiencia), o null si no ha corrido. */
  readonly tokensPerRun: number | null
  /** Discrepancias que OMEGA le detecto en el Libro de la Vida (verificable). */
  readonly discrepancies: number
  readonly lastAt: string | null
}
