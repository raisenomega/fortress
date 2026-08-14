import { isTerminal, type Proposal, type ProposalState } from './proposal'

/** Lo que el motor tiene entre manos en UN proyecto, reducido a un solo estado. */
export type MotorStatus =
  | { readonly kind: 'stopped-critical'; readonly reason: string }
  | { readonly kind: 'awaiting-review'; readonly count: number }
  | { readonly kind: 'processing'; readonly proposalId: string }
  | { readonly kind: 'clean' }

export const CONTAMINADO = 'proyecto contaminado, revision humana requerida'

/** Los estados vivos que esperan a una persona; el resto lo conduce el motor. */
const ESPERA: readonly ProposalState[] = ['OMEGA', 'APROBADO']

const espera = (p: Proposal): boolean => ESPERA.includes(p.state)

/**
 * Reduce las propuestas de un proyecto a un unico estado del motor.
 *
 * La precedencia va por lo que cada estado le PIDE al operador, no por lo
 * avanzado que este: un indicador que dice "procesando" mientras hay otra
 * propuesta parada esperando firma esconde lo unico que habia que hacer.
 *
 * La contaminacion gana a todo y no mira las propuestas: `guardRun` bloquea el
 * proyecto entero hasta que alguien lo revise, asi que da igual lo que hubiera
 * en curso — no va a avanzar.
 *
 * `processing` se deduce por RESTA (vivo y no en espera) en vez de enumerar las
 * fases activas. Una fase nueva en la tabla de transiciones entra sola; una
 * segunda lista del mismo concepto envejeceria por su cuenta.
 */
export function reduceMotorStatus(
  proposals: readonly Proposal[],
  contaminated: boolean
): MotorStatus {
  if (contaminated) return { kind: 'stopped-critical', reason: CONTAMINADO }

  const vivas = proposals.filter((p) => !isTerminal(p.state))
  const esperando = vivas.filter(espera)
  if (esperando.length > 0) return { kind: 'awaiting-review', count: esperando.length }

  const corriendo = vivas.find((p) => !espera(p))
  return corriendo === undefined ? { kind: 'clean' } : { kind: 'processing', proposalId: corriendo.id } // prettier-ignore
}
