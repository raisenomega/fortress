import type { Finding } from './project'

export type ScoreBand = 'solido' | 'aceptable' | 'riesgo'

/** Un proyecto con CRITICALs nunca esta listo para push. Regla no negociable. */
export function isPushReady(findings: readonly Finding[]): boolean {
  return !findings.some((finding) => finding.severity === 'CRITICAL')
}

export function countBySeverity(findings: readonly Finding[]): Record<string, number> {
  return findings.reduce<Record<string, number>>((counts, finding) => {
    counts[finding.severity] = (counts[finding.severity] ?? 0) + 1
    return counts
  }, {})
}

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
