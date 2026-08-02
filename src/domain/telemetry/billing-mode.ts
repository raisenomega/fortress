export type BillingMode = 'suscripcion' | 'api' | 'desconocido'

/**
 * Como se paga lo que consumen los agentes. Importa mucho para no mentir:
 * el CLI reporta `total_cost_usd` SIEMPRE, pero con una suscripcion de
 * Claude ese numero es el precio equivalente por API, no dinero cobrado.
 * Ensenarlo como "Coste" a secas hace creer que hay una factura que no existe.
 */
export interface Billing {
  readonly mode: BillingMode
  /** Plan declarado por el CLI: max, pro... */
  readonly plan: string | null
}

export const UNKNOWN_BILLING: Billing = { mode: 'desconocido', plan: null }

export function costLabel(billing: Billing): string {
  if (billing.mode === 'suscripcion') return 'Equivalente'
  return 'Coste'
}

export function costHint(billing: Billing): string {
  if (billing.mode === 'suscripcion') {
    const plan = billing.plan === null ? 'tu suscripcion' : `tu plan ${billing.plan}`
    return `precio equivalente por API; ${plan} lo cubre, no se te cobra`
  }
  if (billing.mode === 'api') return 'cobrado a tu API key'
  return 'segun Claude Code'
}
