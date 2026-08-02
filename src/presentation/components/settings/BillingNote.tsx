import { costHint, savingHint } from '@domain/telemetry/billing-mode'
import { useTelemetryStore } from '../../stores/telemetry-store'
import { Notice } from '../common/Notice'

/**
 * Con una API key configurada, FORTRESS se la inyecta al CLI y eso anula la
 * suscripcion: el consumo pasa a facturarse de verdad. Es el ahorro mas grande
 * disponible y no es de tokens, asi que se dice aqui mismo.
 */
export function BillingNote(): React.JSX.Element | null {
  const billing = useTelemetryStore((state) => state.billing)
  if (billing.mode === 'desconocido') return null

  const saving = savingHint(billing, true)

  return (
    <Notice tone={billing.mode === 'api' ? 'error' : 'ok'}>
      {costHint(billing)}
      {saving === null ? null : <span className="mt-1 block">{saving}</span>}
    </Notice>
  )
}
