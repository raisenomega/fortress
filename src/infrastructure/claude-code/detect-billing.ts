import { spawnSync } from 'child_process'
import { UNKNOWN_BILLING, type Billing } from '@domain/telemetry/billing-mode'
import { CLAUDE_BIN } from './claude-cli'

interface AuthStatus {
  readonly authMethod?: string
  readonly subscriptionType?: string
}

let cached: Billing | null = null

/**
 * Como paga el operador lo que consumen los agentes. Se pregunta al CLI en vez
 * de suponerlo: con `authMethod: "claude.ai"` el `total_cost_usd` que reporta
 * es el precio equivalente por API, no una factura. Ensenarlo como coste a
 * secas hacia creer que un escaneo habia costado dos dolares reales.
 *
 * Se cachea por proceso: es una llamada al CLI y no cambia a mitad de sesion.
 */
export function detectBilling(): Billing {
  if (cached) return cached

  try {
    const probe = spawnSync(CLAUDE_BIN, ['auth', 'status'], { encoding: 'utf8', timeout: 10_000 })
    if (probe.status !== 0) return UNKNOWN_BILLING

    const status = JSON.parse(probe.stdout) as AuthStatus
    const suscripcion = status.authMethod === 'claude.ai'

    cached = {
      mode: suscripcion ? 'suscripcion' : 'api',
      plan: status.subscriptionType ?? null
    }
    return cached
  } catch {
    return UNKNOWN_BILLING
  }
}
