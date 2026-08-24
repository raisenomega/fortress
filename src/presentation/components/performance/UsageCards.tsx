import { costHint, costLabel } from '@domain/telemetry/billing-mode'
import { formatCost, formatTokens } from '@domain/telemetry/format-usage'
import type { SinFactura } from '@domain/telemetry/sin-factura'
import { detalleSinMedir } from '../../format/sin-factura'
import { useTelemetryStore } from '../../stores/telemetry-store'
import { totalTokens, type TokenUsage } from '@domain/telemetry/token-usage'

interface UsageCardsProps {
  readonly usage: TokenUsage
  readonly sinFactura: SinFactura
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

export function UsageCards({ usage, sinFactura }: UsageCardsProps): React.JSX.Element {
  const billing = useTelemetryStore((state) => state.billing)
  const cost = formatCost(usage.costUsd)
  const falta = detalleSinMedir(sinFactura)

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Card label="Tokens" value={formatTokens(totalTokens(usage))} />
        <Card label="Salida" value={formatTokens(usage.outputTokens)} />
        <Card label="Cache leido" value={formatTokens(usage.cacheReadTokens)} hint="mas barato" />
        {/* Sin coste reportado no se ensena "$0.00": seria afirmar que fue gratis. */}
        <Card
          label={costLabel(billing)}
          value={cost === null ? '—' : `${billing.mode === 'suscripcion' ? '~' : ''}${cost}`}
          hint={cost === null ? 'el motor de texto no lo reporta' : costHint(billing)}
        />
      </div>
      {falta === null ? null : <p className="text-[11px] text-medium">{falta}</p>}
    </div>
  )
}
