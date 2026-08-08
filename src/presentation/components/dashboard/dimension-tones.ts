import { scoreBand } from '@domain/project/fortress-score'

const BAR = { solido: 'bg-success', aceptable: 'bg-medium', riesgo: 'bg-critical' } as const
const TEXT = { solido: 'text-success', aceptable: 'text-medium', riesgo: 'text-critical' } as const

export interface DimensionTone {
  /** Color del relleno de la barra. */
  readonly bar: string
  /** Color del numero. */
  readonly text: string
  /** El numero, o "sin auditar" cuando la dimension no se midio. */
  readonly label: string
  /** Ancho del relleno en %. */
  readonly width: number
}

/**
 * Score de una dimension -> color + ancho. Mismo codigo que el ScoreGauge (verde
 * solido / naranja aceptable / rojo riesgo). null = SIN AUDITAR: gris tenue, NO 0.
 */
export function dimensionTone(score: number | null): DimensionTone {
  if (score === null) {
    return {
      bar: 'bg-muted-foreground/25',
      text: 'text-muted-foreground',
      label: 'sin auditar',
      width: 100
    }
  }
  const band = scoreBand(score)
  return { bar: BAR[band], text: TEXT[band], label: String(score), width: score }
}
