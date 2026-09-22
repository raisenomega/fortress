import type { MotivoSinVerificar } from './no-se-pudo-verificar'
import type { VerificacionDelArbol } from './verificacion-del-arbol'

/**
 * Lo que el gate DEVUELVE: como quedo el arbol y, si fue `desconocida`, POR QUE.
 *
 * El motivo viaja en el valor y no en el estado del modulo que midio. El recibo
 * honesto (ADR-091 §4; ADR-092 cuando la caja no levanta) se arma con lo que el
 * gate dijo en ESTA medida, no con lo que alguien recuerde de la anterior: un
 * mapa por cwd habria contestado por un turno lo que midio otro.
 */
export interface MedidaDelArbol {
  readonly arbol: VerificacionDelArbol
  /** Solo dice algo con `desconocida`. `null` = no se supo la causa. */
  readonly motivo: MotivoSinVerificar | null
}

export function medida(
  arbol: VerificacionDelArbol,
  motivo: MotivoSinVerificar | null = null
): MedidaDelArbol {
  return { arbol, motivo }
}
