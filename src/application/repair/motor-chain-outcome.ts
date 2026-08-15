import type { FailedCondition } from '@domain/repair/auto-merge-policy'
import type { RejectionReason } from '@domain/repair/repair-rejection'

/**
 * Donde acabo una vuelta del motor. TODAS son finales legitimas: que el revisor
 * vete o que el gate se ponga rojo no es una averia, es el sistema haciendo su
 * trabajo. Por eso viajan como resultado y no como error.
 */
export type ChainOutcome =
  | { readonly kind: 'sin-candidato' }
  | { readonly kind: 'obsoleto'; readonly proposalId: string }
  | { readonly kind: 'descartada'; readonly proposalId: string; readonly motivo: string }
  | {
      readonly kind: 'espera-firma'
      readonly proposalId: string
      /** Que freno la integracion, o null si no se llego a mirar la politica. */
      readonly condition: FailedCondition | null
    }
  | { readonly kind: 'integrada'; readonly proposalId: string }

/**
 * Las tres razones que pueden traer una averia del proveedor detras —un 429,
 * una cuota agotada, un corte de red— y no un juicio sobre el fix.
 *
 * La distincion no es cosmetica: quien envuelve al loop reintenta para siempre
 * ante un fallo transitorio y lo mata ante uno terminal. Un veto viajando como
 * error mataria el loop por hacer justo lo que se le pide.
 */
const AVERIAS: readonly RejectionReason[] = ['generator_error', 'omega_timeout', 'omega_error']

export function esAveria(motivo: string): boolean {
  return (AVERIAS as readonly string[]).includes(motivo)
}

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
const DENEGACIONES: readonly FailedCondition[] = ['severity', 'diff', 'files', 'blacklist']

export function esDenegacion(condition: FailedCondition | null): boolean {
  return condition !== null && DENEGACIONES.includes(condition)
}

/** Como se cuenta la vuelta en el chat del proyecto. */
export function describir(outcome: ChainOutcome): string {
  if (outcome.kind === 'sin-candidato') return 'No queda hallazgo elegible que reparar.'
  const corto = 'proposalId' in outcome ? outcome.proposalId.slice(0, 8) : ''
  if (outcome.kind === 'obsoleto') return `${corto}: el hallazgo ya no existe en el codigo.`
  if (outcome.kind === 'descartada') return `${corto}: descartada — ${outcome.motivo}.`
  if (outcome.kind === 'espera-firma') return `${corto}: aprobada, esperando firma humana.`
  return `${corto}: integrada.`
}
