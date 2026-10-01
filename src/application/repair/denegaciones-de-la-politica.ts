import type { FailedCondition } from '@domain/repair/auto-merge-policy'

/**
 * Las cuatro condiciones que son una DENEGACION: la politica estaba activa y
 * freno por un criterio concreto. Se distinguen de la quinta, `disabled`, que
 * es la integracion automatica apagada — el proyecto que la apago quiere que
 * todo espere firma, y cada propuesta aprobada saliendo por esa puerta es el
 * comportamiento pedido, no un bloqueo. Contarla seria frenar al operador por
 * haber elegido bien.
 *
 * `null` tampoco cuenta: ahi ni se llego a mirar la politica.
 */
// prettier-ignore
const DENEGACIONES: readonly FailedCondition[] = ['severity', 'diff', 'files', 'blacklist', 'max-lines']

export function esDenegacion(condition: FailedCondition | null): boolean {
  return condition !== null && DENEGACIONES.includes(condition)
}
