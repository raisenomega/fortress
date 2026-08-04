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
  readonly lastAt: string | null
}
