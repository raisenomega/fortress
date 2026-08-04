import type { OmegaScore, ScoreBand } from '@domain/omega/omega-score'

const BAND: Record<ScoreBand, { readonly label: string; readonly tone: string }> = {
  'confiable-absoluto': { label: 'Confiable absoluto', tone: 'text-success' },
  'generalmente-confiable': { label: 'Generalmente confiable', tone: 'text-success' },
  cuestionable: { label: 'Cuestionable', tone: 'text-medium' },
  'no-confiable': { label: 'No confiable', tone: 'text-critical' },
  'no-usar': { label: 'No usar sin supervision', tone: 'text-critical' },
  'sin-datos': { label: 'Sin datos suficientes', tone: 'text-muted-foreground' }
}

const num = (value: number | null): string => (value === null ? 'sin datos' : `${value}/100`)

interface OmegaScorePanelProps {
  readonly score: OmegaScore | null
}

export function OmegaScorePanel({ score }: OmegaScorePanelProps): React.JSX.Element {
  if (!score) {
    return <p className="text-sm text-muted-foreground">Aun no auditado. Pulsa Auditar.</p>
  }

  const band = BAND[score.band]
  const metrics: ReadonlyArray<readonly [string, string]> = [
    ['Veracidad', num(score.veracity)],
    ['Cumplimiento', num(score.compliance)],
    ['Tokens/hallazgo', score.tokensPerFinding === null ? '—' : String(score.tokensPerFinding)]
  ]

  return (
    <section className="space-y-2 rounded-md border border-border bg-card p-3">
      <div className="flex items-baseline gap-2">
        <span className={`text-lg font-semibold ${band.tone}`}>{score.overall ?? '—'}</span>
        <span className={`text-xs tracking-wide uppercase ${band.tone}`}>{band.label}</span>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-xs">
        {metrics.map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
