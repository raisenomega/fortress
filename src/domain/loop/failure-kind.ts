/** Un fallo de run es transitorio (esperar y reintentar) o terminal (parar). */
export type FailureKind = 'transitorio' | 'terminal'

/**
 * Fallos del proveedor por los que el loop entra en STANDBY en vez de morir:
 * credito agotado, limite de tasa, sobrecarga, corte de red, timeout. En
 * standby no se pierde nada; al recuperarse el proveedor, el ciclo sigue donde
 * quedo. Se cubren mensajes en ingles (los del CLI) y en espanol.
 */
const TRANSIENT =
  /credit|balance|insufficient|saldo|agotad|rate.?limit|too many requests|429|overloaded|503|502|500|network|red|ENOTFOUND|ECONNRESET|ETIMEDOUT|timeout|quota|cuota|unavailable|no disponible|en marcha|already running|in progress/i

/**
 * Clasifica el texto de error de un run. Solo lo claramente transitorio entra en
 * standby; el resto es terminal y el operador ve por que paro. No se marca todo
 * como transitorio a proposito: un standby infinito ocultaria un fallo real.
 */
export function classifyFailure(errorText: string): FailureKind {
  return TRANSIENT.test(errorText) ? 'transitorio' : 'terminal'
}
