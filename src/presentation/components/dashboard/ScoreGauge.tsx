import { scoreBand } from '@domain/project/fortress-score'
import { arcoLleno, EN_CURSO_LABEL, loQueEnsena } from './gauge-look'

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
  /** Hay un recorrido EN MARCHA: el score de la fila es el anterior. */
  readonly enCurso?: boolean
}

export function ScoreGauge({
  score,
  scanned,
  enCurso = false
}: ScoreGaugeProps): React.JSX.Element {
  const ensena = loQueEnsena(scanned, enCurso)
  const lleno = arcoLleno(ensena)

  return (
    <div className={`relative ${lleno ? BAND_CLASS[scoreBand(score)] : 'text-muted-foreground'}`}>
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
          strokeDashoffset={CIRCUMFERENCE * (lleno ? 1 - score / 100 : 1)}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      {ensena === 'en-curso' ? (
        <span className="absolute inset-0 flex items-center justify-center px-1 text-center text-[9px] leading-tight font-semibold">
          {EN_CURSO_LABEL}
        </span>
      ) : (
        <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-semibold">
          {ensena === 'score' ? score : '—'}
        </span>
      )}
    </div>
  )
}
