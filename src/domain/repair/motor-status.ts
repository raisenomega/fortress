import { isTerminal, type Proposal } from './proposal'

/** Lo que el motor tiene entre manos en UN proyecto, reducido a un solo estado. */
export type MotorStatus =
  | { readonly kind: 'stopped-critical'; readonly reason: string }
  | { readonly kind: 'awaiting-review'; readonly count: number }
  | { readonly kind: 'clean' }

export const CONTAMINADO = 'proyecto contaminado, revision humana requerida'

/**
 * Reduce las propuestas de un proyecto a un unico estado del motor.
 *
 * NO existe un estado "procesando". Hubo uno, y era mentira: distinguir la
 * propuesta que alguien esta trabajando de la que lleva dias aparcada exige
 * saber si hay una corrida en vuelo EN ESTE proyecto, y eso el renderer no lo
 * sabe — los botones llevan su propio estado local y la unica senal que cruza
 * el puente es un contador global sin proyecto. Sin fuente que lo sostenga, el
 * estado se cae: toda propuesta viva espera a una persona hasta que se pueda
 * demostrar lo contrario, y ese es justo el aviso que el indicador existe para
 * dar.
 *
 * La contaminacion gana a todo y no mira las propuestas: `guardRun` bloquea el
 * proyecto entero hasta que alguien lo revise, asi que da igual lo que hubiera
 * en curso — no va a avanzar.
 *
 * Que cuenta como viva sale de `isTerminal`, o sea de la tabla de transiciones.
 * Aqui no hay ninguna lista de estados que mantener.
 */
export function reduceMotorStatus(
  proposals: readonly Proposal[],
  contaminated: boolean
): MotorStatus {
  if (contaminated) return { kind: 'stopped-critical', reason: CONTAMINADO }

  const vivas = proposals.filter((p) => !isTerminal(p.state))
  return vivas.length === 0 ? { kind: 'clean' } : { kind: 'awaiting-review', count: vivas.length }
}
