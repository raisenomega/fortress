import type { AgentStats } from '@application/telemetry/build-agent-stats'
import { effectiveness } from '@domain/telemetry/agent-stats'
import { costLabel } from '@domain/telemetry/billing-mode'
import { formatCost, formatTokens } from '@domain/telemetry/format-usage'
import { useTelemetryStore } from '../../stores/telemetry-store'
import { totalTokens } from '@domain/telemetry/token-usage'

interface AgentMetricsProps {
  readonly stats: AgentStats
}

function Cell({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="rounded-md border border-border bg-secondary/30 px-2.5 py-1.5">
      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="font-mono text-sm text-foreground">{value}</p>
    </div>
  )
}

export function AgentMetrics({ stats }: AgentMetricsProps): React.JSX.Element {
  const { totals, outcome } = stats
  const rate = effectiveness(outcome)
  const billing = useTelemetryStore((state) => state.billing)
  const cost = formatCost(totals.usage.costUsd)

  return (
    <div className="grid grid-cols-3 gap-2">
      <Cell label="Ejecuciones" value={`${totals.runs}`} />
      <Cell label="Fixes" value={`${totals.edits}`} />
      <Cell label="Fallidas" value={`${totals.failed}`} />
      <Cell label="Hallazgos" value={`${outcome.reported}`} />
      <Cell label="Resueltos" value={`${outcome.resolved}`} />
      <Cell label="Descartados" value={`${outcome.dismissed}`} />
      {/* Sin hallazgos no hay porcentaje: un 0% acusaria de no servir. */}
      <Cell label="Efectividad" value={rate === null ? '—' : `${Math.round(rate * 100)}%`} />
      <Cell label="Tokens" value={formatTokens(totalTokens(totals.usage))} />
      <Cell
        label={costLabel(billing)}
        value={cost === null ? '—' : `${billing.mode === 'suscripcion' ? '~' : ''}${cost}`}
      />
    </div>
  )
}
