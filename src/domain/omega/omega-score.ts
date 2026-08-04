/** Bandas del spec. 'sin-datos' es honesto: no hay base para puntuar todavia. */
export type ScoreBand =
  | 'confiable-absoluto'
  | 'generalmente-confiable'
  | 'cuestionable'
  | 'no-confiable'
  | 'no-usar'
  | 'sin-datos'

export interface ScoreInputs {
  readonly okChecks: number
  readonly discrepancies: number
  readonly runs: number
  readonly failedRuns: number
  readonly outputTokens: number
  readonly verifiedFindings: number
}

export interface OmegaScore {
  /** 0-100 o null si no hay hallazgos que verificar. */
  readonly veracity: number | null
  /** 0-100 o null si el agente no ha corrido. */
  readonly compliance: number | null
  /** Informativo, NO puntuado: sin una base de flota, un umbral seria arbitrario. */
  readonly tokensPerFinding: number | null
  /** Ponderado de lo que TIENE datos, o null si no hay ninguno. */
  readonly overall: number | null
  readonly band: ScoreBand
}

function ratio(good: number, total: number): number | null {
  return total === 0 ? null : Math.round((100 * good) / total)
}

export function bandFor(overall: number | null): ScoreBand {
  if (overall === null) return 'sin-datos'
  if (overall >= 90) return 'confiable-absoluto'
  if (overall >= 75) return 'generalmente-confiable'
  if (overall >= 60) return 'cuestionable'
  if (overall >= 40) return 'no-confiable'
  return 'no-usar'
}

/** Solo pondera dimensiones con datos; la veracidad pesa mas por ir con evidencia. */
function weighted(veracity: number | null, compliance: number | null): number | null {
  const parts: Array<readonly [number, number]> = []
  if (veracity !== null) parts.push([veracity, 0.6])
  if (compliance !== null) parts.push([compliance, 0.4])
  if (parts.length === 0) return null
  const peso = parts.reduce((sum, [, w]) => sum + w, 0)
  return Math.round(parts.reduce((sum, [v, w]) => sum + v * w, 0) / peso)
}

export function computeScore(inputs: ScoreInputs): OmegaScore {
  const veracity = ratio(inputs.okChecks, inputs.okChecks + inputs.discrepancies)
  const compliance = ratio(inputs.runs - inputs.failedRuns, inputs.runs)
  const overall = weighted(veracity, compliance)
  return {
    veracity,
    compliance,
    tokensPerFinding:
      inputs.verifiedFindings === 0 ? null : Math.round(inputs.outputTokens / inputs.verifiedFindings),
    overall,
    band: bandFor(overall)
  }
}
