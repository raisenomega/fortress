import { costHint } from '@domain/telemetry/billing-mode'
import { formatCost, formatTokens } from '@domain/telemetry/format-usage'
import { totalTokens } from '@domain/telemetry/token-usage'
import { useTelemetryStore } from '../../stores/telemetry-store'
import { useUiStore } from '../../stores/ui-store'

/**
 * Consumo de la sesion. El coste solo aparece cuando algun motor lo reporta:
 * la API devuelve tokens pero no dinero, y ensenar "$0.00" ahi afirmaria que
 * fue gratis en vez de admitir que no se sabe.
 */
export function UsageIndicator(): React.JSX.Element | null {
  const session = useTelemetryStore((state) => state.session)
  const billing = useTelemetryStore((state) => state.billing)
  const setView = useUiStore((state) => state.setView)
  const tokens = totalTokens(session)

  if (tokens === 0) return null

  const cost = formatCost(session.costUsd)
  const title = cost
    ? `Consumo de esta sesion · ${costHint(billing)}`
    : 'Consumo de esta sesion. El motor de solo texto no reporta coste'

  return (
    <button
      type="button"
      onClick={() => setView('rendimiento')}
      title={`${title}. Pulsa para ver el detalle`}
      className="tap rounded px-1 font-mono hover:text-foreground"
    >
      {formatTokens(tokens)} tokens
      {cost ? ` · ${billing.mode === 'suscripcion' ? '~' : ''}${cost}` : ''}
    </button>
  )
}
