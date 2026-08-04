import { loopStop, type LoopStopReason } from '@domain/loop/loop-decision'
import type { LoopPhase, LoopStatus } from '@domain/loop/loop-status'
import type { LoopConfig, LoopDeps } from './loop-deps'

/** Estado mutable de una sesion de loop mientras corre el ciclo. */
export interface Progress {
  readonly recentScores: number[]
  cyclesDone: number
  score: number | null
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
