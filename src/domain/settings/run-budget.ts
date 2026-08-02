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
export const MAX_USD_PER_RUN = 3

/** Verificado en `claude --help`: solo tiene efecto junto a --print (-p). */
export const BUDGET_FLAG = '--max-budget-usd'
