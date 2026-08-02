import { spawnSync } from 'child_process'
import { UNKNOWN_BILLING, type Billing } from '@domain/telemetry/billing-mode'
import { CLAUDE_BIN } from './claude-cli'

interface AuthStatus {
  readonly authMethod?: string
  readonly subscriptionType?: string
}

/**
 * Como paga el operador lo que consumen los agentes. Se pregunta al CLI en vez
 * de suponerlo: con `authMethod: "claude.ai"` el `total_cost_usd` que reporta
 * es el precio equivalente por API, no una factura. Ensenarlo como coste a
 * secas hacia creer que un escaneo habia costado dos dolares reales.
 *
 */
export function detectBilling(hasOwnKey: boolean): Billing {
  // Si FORTRESS tiene su propia key, se la inyecta al proceso hijo en
  // ANTHROPIC_API_KEY y eso ANULA la suscripcion: el consumo se factura a esa
  // clave y aparece en la consola de Anthropic. Da igual lo que diga el CLI
  // sobre como esta autenticado por su cuenta.
  if (hasOwnKey) return { mode: 'api', plan: null }

  try {
    const probe = spawnSync(CLAUDE_BIN, ['auth', 'status'], { encoding: 'utf8', timeout: 10_000 })
    if (probe.status !== 0) return UNKNOWN_BILLING

    const status = JSON.parse(probe.stdout) as AuthStatus
    const suscripcion = status.authMethod === 'claude.ai'

    return {
      mode: suscripcion ? 'suscripcion' : 'api',
      plan: status.subscriptionType ?? null
    }
  } catch {
    return UNKNOWN_BILLING
  }
}
