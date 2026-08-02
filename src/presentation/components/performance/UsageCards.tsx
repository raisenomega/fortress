import { formatCost, formatTokens } from '@domain/telemetry/format-usage'
import { totalTokens, type TokenUsage } from '@domain/telemetry/token-usage'

interface UsageCardsProps {
  readonly usage: TokenUsage
}

interface CardProps {
  readonly label: string
  readonly value: string
  readonly hint?: string
}

function Card({ label, value, hint }: CardProps): React.JSX.Element {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-[10px] tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className="font-mono text-xl text-foreground">{value}</p>
      {hint ? <p className="text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function UsageCards({ usage }: UsageCardsProps): React.JSX.Element {
  const cost = formatCost(usage.costUsd)

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <Card label="Tokens" value={formatTokens(totalTokens(usage))} />
      <Card label="Salida" value={formatTokens(usage.outputTokens)} />
      <Card label="Cache leido" value={formatTokens(usage.cacheReadTokens)} hint="mas barato" />
      {/* Sin coste reportado no se ensena "$0.00": seria afirmar que fue gratis. */}
      <Card
        label="Coste"
        value={cost ?? '—'}
        hint={cost ? 'segun Claude Code' : 'el motor de texto no lo reporta'}
      />
    </div>
  )
}
