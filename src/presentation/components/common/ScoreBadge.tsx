import { scoreBand } from '@domain/project/fortress-score'

const BAND_CLASS = {
  solido: 'text-success',
  aceptable: 'text-medium',
  riesgo: 'text-critical'
} as const

interface ScoreBadgeProps {
  readonly score: number
  readonly showMax?: boolean
}

export function ScoreBadge({ score, showMax = true }: ScoreBadgeProps): React.JSX.Element {
  return (
    <span className={`font-mono text-xs font-semibold ${BAND_CLASS[scoreBand(score)]}`}>
      {score}
      {showMax ? '/100' : ''}
    </span>
  )
}
