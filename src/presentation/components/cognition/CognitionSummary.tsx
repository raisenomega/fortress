import type { CognitionSnapshot } from '@domain/cognition/cognition-log'
import {
  countPatterns,
  extinctionRate,
  totalRecurrences
} from '@domain/cognition/cognition-metrics'

interface CognitionSummaryProps {
  readonly snapshot: CognitionSnapshot
}

function Metric({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-[10px] tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className="font-mono text-lg text-foreground">{value}</p>
    </div>
  )
}

export function CognitionSummary({ snapshot }: CognitionSummaryProps): React.JSX.Element {
  const counts = countPatterns(snapshot.patterns)
  const rate = extinctionRate(counts)

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      <Metric
        label="Generacion"
        value={snapshot.generation === null ? '—' : `${snapshot.generation}`}
      />
      <Metric label="Activos" value={`${counts.ACTIVE}`} />
      <Metric label="Mitigados" value={`${counts.MITIGATED}`} />
      <Metric label="Extintos" value={`${counts.EXTINTO}`} />
      {/* Sin patrones la tasa no es 0%, es desconocida. */}
      <Metric label="Extincion" value={rate === null ? '—' : `${Math.round(rate * 100)}%`} />
      <Metric label="Recurrencias" value={`${totalRecurrences(snapshot.patterns)}`} />
    </div>
  )
}
