import { esDenegacion, type ChainOutcome } from '../repair/motor-chain-outcome'
import type { Progress } from './loop-progress'

/**
 * Lo que cada vuelta mueve segun donde acabo. Vive aparte del estado porque son
 * decisiones —que cuenta, que borra, cuando toca volver a medir— y no simple
 * almacenamiento.
 */

/**
 * Mueve la racha de denegaciones. Solo suma la de una politica encendida
 * —esDenegacion deja fuera la integracion apagada, que es el operador queriendo
 * firmar a mano— y solo la integracion la borra: seguir esperando firma no
 * rompe una racha de esperas.
 */
export function anotarDenegacion(p: Progress, outcome: ChainOutcome): void {
  if (outcome.kind === 'integrada') p.consecutiveDenials = 0
  else if (outcome.kind === 'espera-firma' && esDenegacion(outcome.condition)) {
    p.consecutiveDenials += 1
  }
}

/**
 * Mueve la racha de vueltas en vacio. Cualquier otro final la borra: si el
 * motor encontro algo que hacer, la baraja no estaba agotada. Basta un
 * candidato para desmentir la racha entera.
 */
export function anotarSinCandidato(p: Progress, outcome: ChainOutcome): void {
  if (outcome.kind === 'sin-candidato') p.consecutiveNoCandidates += 1
  else p.consecutiveNoCandidates = 0
}

/** Los tres finales que son AVANCE: hay un fix vivo que el operador tiene. */
const AVANCE: readonly ChainOutcome['kind'][] = ['integrada', 'espera-firma', 'espera-omega']

/**
 * Mueve la racha de no-avance. Suma con cada fix descartado y la borra
 * cualquier avance real: una integracion, o una propuesta viva esperando firma
 * —que no se integrara sola, pero existe y es del operador—. Las vueltas sin
 * candidato y las de hallazgo obsoleto no la tocan: no hubo fix que muriera,
 * pero tampoco nada que celebrar, y esas ya las cuenta su propio freno.
 *
 * `espera-omega` cuenta como avance, y es la que mas importa acertar: en modo
 * hasta-gate TODAS las vueltas buenas acaban ahi. Si no borrase la racha, el
 * loop se mataria con `sin-avance` justo mientras trabaja bien, y el freno
 * pareceria un fallo del motor en vez de un contador mal cableado.
 */
export function anotarDescartada(p: Progress, outcome: ChainOutcome): void {
  if (outcome.kind === 'descartada') p.consecutiveDiscarded += 1
  else if (AVANCE.includes(outcome.kind)) p.consecutiveDiscarded = 0
}

/**
 * Si toca volver a medir. Cuenta INTEGRACIONES, no vueltas: entre dos merges el
 * arbol es identico, y escanearlo otra vez seria pagar por leer lo mismo. Un
 * tope de cero pide escanear siempre, que es como se comportaba antes de que
 * hubiera cadencia.
 *
 * `espera-omega` NO cuenta, y es una decision, no un olvido: un fix parado en
 * su worktree no ha cambiado este arbol, asi que medirlo daria el mismo score.
 * En modo hasta-gate eso significa que no se re-escanea en toda la sesion —
 * correcto, porque no hay nada nuevo que medir hasta que se firme algo.
 */
export function tocaEscanear(p: Progress, outcome: ChainOutcome, cada: number): boolean {
  if (outcome.kind === 'integrada') p.integrationsSinceScan += 1
  return p.integrationsSinceScan >= cada
}

/** Se volvio a medir: la cuenta arranca de nuevo. */
export function reiniciarCadencia(p: Progress): void {
  p.integrationsSinceScan = 0
}
