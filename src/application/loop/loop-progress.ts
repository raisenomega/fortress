import type { LoopDeps } from './loop-deps'

/**
 * Estado mutable de una sesion de loop mientras corre el ciclo. Que lo mueve
 * vive en `loop-counters.ts`; aqui esta solo que se guarda.
 *
 * Ninguna de las tres cuentas seguidas se persiste: al reanudar, la politica y
 * la baraja pueden ser otras, y arrastrar una racha vieja seria juzgar lo nuevo
 * con evidencia caducada. Reanudar es el operador diciendo "sigue"; se le da
 * margen fresco.
 */
export interface Progress {
  readonly recentScores: number[]
  cyclesDone: number
  /** Propuestas seguidas que la politica denego sin integrar. */
  consecutiveDenials: number
  /** Integraciones acumuladas desde el ultimo escaneo. */
  integrationsSinceScan: number
  /** Vueltas seguidas en las que no habia nada que reparar. */
  consecutiveNoCandidates: number
  /** Vueltas seguidas en las que se genero un fix y murio sin integrarse. */
  consecutiveDiscarded: number
  score: number | null
}

/** Progreso de una sesion que arranca de cero (no una que se reanuda). */
export function freshProgress(): Progress {
  return {
    recentScores: [],
    cyclesDone: 0,
    consecutiveDenials: 0,
    integrationsSinceScan: 0,
    consecutiveNoCandidates: 0,
    consecutiveDiscarded: 0,
    score: null
  }
}

/**
 * Guarda lo que dejo la vuelta sin esperar al proximo escaneo. Se persistia
 * solo dentro de `recordScore`, que corre al medir, y solo se vuelve a medir
 * tras integraciones: en un proyecto donde nada se integra, el contador vivo
 * llegaba a seis y el guardado seguia en cero. Lo delataba el motivo de parada,
 * que anunciaba "0 de 6 propuestas cerradas" al pararse por haberlas cerrado.
 *
 * Persistir dos veces en la misma vuelta —esta y la de `recordScore` si toco
 * medir— no rompe nada: es el mismo upsert con el estado mas fresco.
 */
export function recordCycle(deps: LoopDeps, p: Progress): void {
  deps.persist(p.recentScores, p.cyclesDone)
}

/** Anota un score nuevo (el ultimo, y al frente del historial) y lo persiste. */
export function recordScore(deps: LoopDeps, p: Progress, score: number): void {
  p.score = score
  p.recentScores.unshift(score)
  deps.persist(p.recentScores, p.cyclesDone)
}
