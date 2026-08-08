import type { DimensionKey, DimensionScores } from './dimension'
import type { IntegralScore } from './integral-score'

/**
 * Empaqueta el score por dimension en el Record que persiste el repositorio.
 * `byDimension` siempre recorre las 6 DIMENSIONS, asi que las 6 claves estan.
 */
export function dimensionScoresOf(score: IntegralScore): DimensionScores {
  const out = {} as Record<DimensionKey, number | null>
  for (const dimension of score.byDimension) out[dimension.key] = dimension.score
  return out
}
