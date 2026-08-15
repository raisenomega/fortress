import { esDenegacion, type ChainOutcome } from '../repair/motor-chain-outcome'
import type { LoopDeps } from './loop-deps'

/** Estado mutable de una sesion de loop mientras corre el ciclo. */
export interface Progress {
  readonly recentScores: number[]
  cyclesDone: number
  /**
   * Denegaciones seguidas. NO se persiste: al reanudar, la politica y la baraja
   * pueden ser otras, y arrastrar la racha vieja seria juzgar lo nuevo con
   * evidencia caducada. Reanudar es el operador diciendo "sigue"; se le da
   * margen fresco.
   */
  consecutiveDenials: number
  /** Integraciones acumuladas desde el ultimo escaneo. Tampoco se persiste. */
  integrationsSinceScan: number
  score: number | null
}

/** Progreso de una sesion que arranca de cero (no una que se reanuda). */
export function freshProgress(): Progress {
  return {
    recentScores: [],
    cyclesDone: 0,
    consecutiveDenials: 0,
    integrationsSinceScan: 0,
    score: null
  }
}

/**
 * Mueve la racha segun donde acabo la vuelta. Solo suma la denegacion de una
 * politica encendida —esDenegacion deja fuera la integracion apagada, que es el
 * operador queriendo firmar a mano— y solo la integracion la borra: seguir
 * esperando firma no rompe una racha de esperas.
 */
export function anotarDenegacion(p: Progress, outcome: ChainOutcome): void {
  if (outcome.kind === 'integrada') p.consecutiveDenials = 0
  else if (outcome.kind === 'espera-firma' && esDenegacion(outcome.condition)) {
    p.consecutiveDenials += 1
  }
}

/**
 * Si toca volver a medir. Cuenta INTEGRACIONES, no vueltas: entre dos merges el
 * arbol es identico, y escanearlo otra vez seria pagar por leer lo mismo. Un
 * tope de cero pide escanear siempre, que es como se comportaba antes de que
 * hubiera cadencia.
 */
export function tocaEscanear(p: Progress, outcome: ChainOutcome, cada: number): boolean {
  if (outcome.kind === 'integrada') p.integrationsSinceScan += 1
  return p.integrationsSinceScan >= cada
}

/** Se volvio a medir: la cuenta arranca de nuevo. */
export function reiniciarCadencia(p: Progress): void {
  p.integrationsSinceScan = 0
}

/** Anota un score nuevo (el ultimo, y al frente del historial) y lo persiste. */
export function recordScore(deps: LoopDeps, p: Progress, score: number): void {
  p.score = score
  p.recentScores.unshift(score)
  deps.persist(p.recentScores, p.cyclesDone)
}
