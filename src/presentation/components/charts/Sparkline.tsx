const WIDTH = 220
const HEIGHT = 44
const PAD = 4

interface SparklineProps {
  /** Valores en orden cronologico, de 0 a 100. */
  readonly points: readonly number[]
  readonly className?: string
}

/**
 * Una linea con un solo punto no es una tendencia. Se exige un minimo de dos
 * para no dibujar una recta plana que sugiera estabilidad inexistente.
 */
export function Sparkline({ points, className }: SparklineProps): React.JSX.Element | null {
  if (points.length < 2) return null

  const step = (WIDTH - PAD * 2) / (points.length - 1)
  const path = points
    .map((value, index) => {
      const x = PAD + index * step
      const y = PAD + (1 - Math.min(100, Math.max(0, value)) / 100) * (HEIGHT - PAD * 2)
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden>
      <path
        d={path}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ?? 'stroke-primary'}
      />
    </svg>
  )
}
