import { normalizeScore } from '../project/fortress-score'
import { scoreFromFindings } from '../scan/score-from-findings'
import { CRITICAL_CEILING } from '../shared/penalty-score'
import type { HasSeverity } from '../shared/severity'
import { DIMENSIONS, type DimensionKey } from './dimension'

/**
 * Entrada de una dimension: sus hallazgos (penalizados 25/8/3/1), un score
 * DIRECTO (p.ej. "sin tests" = 0, o cobertura), o null/ausente = SIN DATOS.
 */
export type DimensionInput = readonly HasSeverity[] | { readonly score: number } | null | undefined
export type InputByDimension = Readonly<Partial<Record<DimensionKey, DimensionInput>>>

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

function isFindings(input: DimensionInput): input is readonly HasSeverity[] {
  return Array.isArray(input)
}

function scoreDimension(input: DimensionInput): number | null {
  if (input === null || input === undefined) return null
  return isFindings(input) ? scoreFromFindings(input) : normalizeScore(input.score)
}

/**
 * Score integral: por dimension, score determinista (o null si no se midio). El
 * global es la media PONDERADA de las medidas (sin datos NO cuenta como 100). Con
 * cualquier CRITICAL abierto en una dimension medida por hallazgos, techo 64.
 */
export function computeIntegralScore(byKey: InputByDimension): IntegralScore {
  const byDimension: DimensionScore[] = DIMENSIONS.map((dim) => ({
    key: dim.key,
    label: dim.label,
    weight: dim.weight,
    score: scoreDimension(byKey[dim.key]),
    count: isFindings(byKey[dim.key]) ? (byKey[dim.key] as readonly HasSeverity[]).length : 0
  }))
  const measured = byDimension.filter((d) => d.score !== null)
  const weightSum = measured.reduce((sum, d) => sum + d.weight, 0)
  const weighted = measured.reduce((sum, d) => sum + d.weight * (d.score ?? 0), 0)
  const mean = weightSum === 0 ? 0 : Math.round(weighted / weightSum)
  const critical = DIMENSIONS.some((d) => {
    const input = byKey[d.key]
    return isFindings(input) && input.some((finding) => finding.severity === 'CRITICAL')
  })
  const missing = byDimension.filter((d) => d.score === null).map((d) => d.label)
  return {
    global: critical ? Math.min(mean, CRITICAL_CEILING) : mean,
    partial: missing.length > 0,
    missing,
    byDimension
  }
}
