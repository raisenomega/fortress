import { loopStop, solvedStreak, type LoopStopReason } from '@domain/loop/loop-decision'
import type { LoopPhase, LoopStatus } from '@domain/loop/loop-status'
import type { LoopConfig, LoopDeps } from './loop-deps'

/** Estado mutable de una sesion de loop mientras corre el ciclo. */
export interface Progress {
  readonly recentScores: number[]
  cyclesDone: number
  score: number | null
}

/** Progreso de una sesion que arranca de cero (no una que se reanuda). */
export function freshProgress(): Progress {
  return { recentScores: [], cyclesDone: 0, score: null }
}

/** Anota un score nuevo (el ultimo, y al frente del historial) y lo persiste. */
export function recordScore(deps: LoopDeps, p: Progress, score: number): void {
  p.score = score
  p.recentScores.unshift(score)
  deps.persist(p.recentScores, p.cyclesDone)
}

export function statusOf(
  config: LoopConfig,
  deps: LoopDeps,
  p: Progress,
  phase: LoopPhase,
  stopReason: LoopStopReason | null
): LoopStatus {
  return {
    projectId: config.projectId,
    phase,
    cycle: p.cyclesDone + 1,
    maxCycles: config.maxCycles,
    score: p.score,
    spentSession: deps.spentSession(),
    costCap: config.costCap,
    solvedStreak: solvedStreak(p.recentScores),
    stopReason
  }
}

/** El motivo de parada segun el estado actual, o null si el loop puede seguir. */
export function nextStop(config: LoopConfig, deps: LoopDeps, p: Progress): LoopStopReason | null {
  return loopStop({
    cancelled: deps.isCancelled(),
    spentSession: deps.spentSession(),
    costCap: config.costCap,
    cyclesDone: p.cyclesDone,
    maxCycles: config.maxCycles,
    recentScores: p.recentScores
  })
}
