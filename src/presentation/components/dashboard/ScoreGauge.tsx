import { scoreBand } from '@domain/project/fortress-score'

const BAND_CLASS = {
  solido: 'text-success',
  aceptable: 'text-medium',
  riesgo: 'text-critical'
} as const

const SIZE = 64
const STROKE = 6
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface ScoreGaugeProps {
  readonly score: number
  /** Sin escaneo previo el arco se pinta vacio y atenuado. */
  readonly scanned: boolean
}

export function ScoreGauge({ score, scanned }: ScoreGaugeProps): React.JSX.Element {
  const progress = scanned ? score / 100 : 0

  return (
    <div className={`relative ${scanned ? BAND_CLASS[scoreBand(score)] : 'text-muted-foreground'}`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-border"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-semibold">
        {scanned ? score : '—'}
      </span>
    </div>
  )
}
