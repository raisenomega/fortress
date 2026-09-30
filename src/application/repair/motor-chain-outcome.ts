import type { FailedCondition } from '@domain/repair/auto-merge-policy'
import { NO_ES_SU_VEHICULO, VA_POR_EL_TERMINAL } from '@domain/repair/vehiculo-del-motor'
import type { PlanNegado } from './resultado-del-plan'

/**
 * Donde acabo una vuelta del motor. TODAS son finales legitimas: que el revisor
 * vete o que el gate se ponga rojo no es una averia, es el sistema haciendo su
 * trabajo. Por eso viajan como resultado y no como error.
 */
export type ChainOutcome =
  | { readonly kind: 'sin-candidato' }
  /** El perimetro lo nego (ADR-107): no es que no haya nada, es que no es suyo. */
  | { readonly kind: 'negado' }
  | { readonly kind: 'obsoleto'; readonly proposalId: string }
  | { readonly kind: 'descartada'; readonly proposalId: string; readonly motivo: string }
  | {
      readonly kind: 'espera-firma'
      readonly proposalId: string
      /** Que freno la integracion, o null si no se llego a mirar la politica. */
      readonly condition: FailedCondition | null
    }
  /**
   * Gate verde y OMEGA SIN CORRER: el motor paro por encargo, no por un juicio.
   *
   * Es un final distinto de `espera-firma`, y confundirlos seria caro. Alli el
   * revisor ya aprobo y quien freno fue la politica de integracion; aqui nadie
   * ha juzgado todavia. El trabajo esta hecho y guardado en su worktree, y lo
   * que espera es que un humano autorice el juicio.
   */
  | { readonly kind: 'espera-omega'; readonly proposalId: string }
  | { readonly kind: 'integrada'; readonly proposalId: string }

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

/** Como se cuenta la vuelta en el chat del proyecto. */
/**
 * El motivo del plan, traducido a desenlace. Solo el bloqueo del perimetro gana
 * casilla propia: los otros dos —proyecto desconocido y sin HEAD de git— se
 * cuentan como antes para no ensanchar el vocabulario del parte sin dato que lo
 * pida, y quedan anotados como tales en el tipo del plan.
 */
export const desenlaceDelPlan = (reason: PlanNegado): ChainOutcome =>
  reason === NO_ES_SU_VEHICULO ? { kind: 'negado' } : { kind: 'sin-candidato' }

export function describir(outcome: ChainOutcome): string {
  if (outcome.kind === 'sin-candidato') return 'No queda hallazgo elegible que reparar.'
  if (outcome.kind === 'negado') return VA_POR_EL_TERMINAL
  const corto = 'proposalId' in outcome ? outcome.proposalId.slice(0, 8) : ''
  if (outcome.kind === 'obsoleto') return `${corto}: el hallazgo ya no existe en el codigo.`
  if (outcome.kind === 'descartada') return `${corto}: descartada — ${outcome.motivo}.`
  if (outcome.kind === 'espera-firma') return `${corto}: aprobada, esperando firma humana.`
  // Antes de este caso el `return` final se tragaba cualquier kind nuevo y lo
  // anunciaba como integrada. Una propuesta parada en el gate contada como
  // integrada es la peor linea posible en el chat del operador.
  if (outcome.kind === 'espera-omega') return `${corto}: gate verde, esperando firma para juzgarla.`
  return `${corto}: integrada.`
}
