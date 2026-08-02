export type ScoreBand = 'solido' | 'aceptable' | 'riesgo'

export function scoreBand(score: number): ScoreBand {
  if (score >= 85) return 'solido'
  if (score >= 65) return 'aceptable'
  return 'riesgo'
}

/** Clamp defensivo: el score que llega de un scan externo puede venir fuera de rango. */
export function normalizeScore(score: number): number {
  if (!Number.isFinite(score)) return 0
  return Math.max(0, Math.min(100, Math.round(score)))
}
