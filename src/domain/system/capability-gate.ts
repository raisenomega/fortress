import { computeScore, type ScoreBand, type ScoreInputs } from '../omega/omega-score'

/** Bandas en las que OMEGA BLOQUEA una promocion: evidencia de que no es fiable. */
const VETOED_BANDS: readonly ScoreBand[] = ['no-confiable', 'no-usar']

export interface OmegaGateVerdict {
  /** OMEGA solo bloquea CON evidencia; jamas aprueba por si mismo (testigo-no-actor). */
  readonly vetoed: boolean
  readonly band: ScoreBand
  readonly reason: string | null
}

/**
 * Veredicto de OMEGA sobre promover una capacidad, con la MISMA puntuacion por
 * evidencia que juzga a los agentes. Veta si la banda cae a 'no-confiable' o
 * peor. Sin evidencia ('sin-datos') NO veta: es silencio, no aprobacion. Quien
 * promueve es el gate por riesgo (humano para un agente); OMEGA solo puede frenar.
 */
export function omegaGate(inputs: ScoreInputs): OmegaGateVerdict {
  const { band } = computeScore(inputs)
  const vetoed = VETOED_BANDS.includes(band)
  const reason = vetoed
    ? `OMEGA veta: banda ${band} (${inputs.failedRuns}/${inputs.runs} ejecuciones fallidas)`
    : null
  return { vetoed, band, reason }
}
