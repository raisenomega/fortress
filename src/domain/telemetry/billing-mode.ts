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
  if (billing.mode === 'api') return 'dinero real, cobrado a la API key de FORTRESS'
  return 'segun Claude Code'
}

/**
 * Consejo con el ahorro mas grande disponible, que no es de tokens: con una
 * key configurada FORTRESS la inyecta al CLI y eso anula la suscripcion. Sin
 * ella, las mismas ejecuciones van contra el plan y no cuestan dinero.
 */
export function savingHint(billing: Billing, hasSubscriptionAvailable: boolean): string | null {
  if (billing.mode !== 'api' || !hasSubscriptionAvailable) return null
  return 'Quitando la API key de FORTRESS, estas ejecuciones irian contra tu suscripcion y no costarian dinero.'
}
