/**
 * Tope por ejecucion, en dolares equivalentes. Es una red de seguridad, no un
 * presupuesto: si un agente se pone a leer un repositorio enorme, el CLI corta
 * al llegar aqui en vez de seguir hasta agotar la cuota del operador.
 *
 * El valor sale de la medida real: un escaneo de este proyecto ronda $1, asi
 * que $3 deja margen de sobra para un repo grande y corta una espiral.
 *
 * Con suscripcion el CLI calcula el mismo equivalente, asi que el tope
 * funciona igual aunque no haya factura.
 */
export const DEFAULT_PER_RUN = 3
export const DEFAULT_PER_DAY = 10

export interface Budget {
  /** Tope por ejecucion, en dolares. 0 desactiva el tope. */
  readonly perRun: number
  /** Tope de gasto diario sumando todas las ejecuciones. 0 lo desactiva. */
  readonly perDay: number
}

export const DEFAULT_BUDGET: Budget = { perRun: DEFAULT_PER_RUN, perDay: DEFAULT_PER_DAY }

/** Un tope que no se entiende es un tope que no protege: se acota a lo sensato. */
export function parseBudget(perRun: string | null, perDay: string | null): Budget {
  return {
    perRun: parseAmount(perRun, DEFAULT_PER_RUN),
    perDay: parseAmount(perDay, DEFAULT_PER_DAY)
  }
}

function parseAmount(raw: string | null, fallback: number): number {
  if (raw === null) return fallback

  const value = Number.parseFloat(raw.replace(',', '.'))
  if (!Number.isFinite(value) || value < 0) return fallback
  return Math.min(value, 1000)
}

/** Null si todavia cabe; si no, el motivo exacto para ensenarlo tal cual. */
export function dayLimitReached(budget: Budget, spentToday: number): string | null {
  if (budget.perDay <= 0) return null
  if (spentToday < budget.perDay) return null

  return (
    `Tope diario alcanzado: llevas $${spentToday.toFixed(2)} de $${budget.perDay.toFixed(2)}. ` +
    'Subelo en Configuracion o espera a manana.'
  )
}

/** Verificado en `claude --help`: solo tiene efecto junto a --print (-p). */
export const BUDGET_FLAG = '--max-budget-usd'
