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
    score: null
  }
}

/** Anota un score nuevo (el ultimo, y al frente del historial) y lo persiste. */
export function recordScore(deps: LoopDeps, p: Progress, score: number): void {
  p.score = score
  p.recentScores.unshift(score)
  deps.persist(p.recentScores, p.cyclesDone)
}
