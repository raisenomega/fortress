import { scoreFromFindings } from '../scan/score-from-findings'
import { CRITICAL_CEILING } from '../shared/penalty-score'
import type { HasSeverity } from '../shared/severity'
import { DIMENSIONS, type DimensionKey } from './dimension'

/** Hallazgos de una dimension, o null/ausente = SIN DATOS (no medida). */
export type DimensionFindings = readonly HasSeverity[] | null | undefined
export type FindingsByDimension = Readonly<Partial<Record<DimensionKey, DimensionFindings>>>

export interface DimensionScore {
  readonly key: DimensionKey
  readonly label: string
  readonly weight: number
  /** 0-100, o null = SIN DATOS (no cuenta como 100). */
  readonly score: number | null
  readonly count: number
}

export interface IntegralScore {
  readonly global: number
  /** true si alguna dimension quedo SIN DATOS: el global es PARCIAL. */
  readonly partial: boolean
  readonly missing: readonly string[]
  readonly byDimension: readonly DimensionScore[]
}

function scoreDimension(findings: DimensionFindings): number | null {
  return findings === null || findings === undefined ? null : scoreFromFindings(findings)
}

/**
 * Score integral: por dimension, score determinista de sus hallazgos (o null si
 * no se midio). El global es la media PONDERADA de las medidas (una dimension sin
 * datos NO cuenta como 100). Con cualquier CRITICAL abierto, techo 64.
 */
export function computeIntegralScore(byKey: FindingsByDimension): IntegralScore {
  const byDimension: DimensionScore[] = DIMENSIONS.map((dim) => ({
    key: dim.key,
    label: dim.label,
    weight: dim.weight,
    score: scoreDimension(byKey[dim.key]),
    count: byKey[dim.key]?.length ?? 0
  }))
  const weightSum = byDimension.reduce((sum, d) => (d.score === null ? sum : sum + d.weight), 0)
  const weighted = byDimension.reduce(
    (sum, d) => (d.score === null ? sum : sum + d.weight * d.score),
    0
  )
  const mean = weightSum === 0 ? 0 : Math.round(weighted / weightSum)
  const critical = DIMENSIONS.some((d) =>
    (byKey[d.key] ?? []).some((f) => f.severity === 'CRITICAL')
  )
  const missing = byDimension.filter((d) => d.score === null).map((d) => d.label)
  return {
    global: critical ? Math.min(mean, CRITICAL_CEILING) : mean,
    partial: missing.length > 0,
    missing,
    byDimension
  }
}
