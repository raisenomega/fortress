import { loopStop, solvedStreak, type LoopStopReason } from '@domain/loop/loop-decision'
import type { LoopPhase, LoopStatus } from '@domain/loop/loop-status'
import type { LoopConfig, LoopDeps } from './loop-deps'
import type { Progress } from './loop-progress'

/**
 * Lo que se cuenta del progreso hacia fuera: al renderer, que lo pinta, y al
 * dominio, que decide si el loop sigue. El estado en si —y como se mueve— vive
 * en `loop-progress.ts`; aqui esta solo como se proyecta.
 */

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
    consecutiveDenials: p.consecutiveDenials,
    maxConsecutiveDenials: deps.maxConsecutiveDenials(),
    consecutiveNoCandidates: p.consecutiveNoCandidates,
    maxConsecutiveNoCandidates: deps.maxConsecutiveNoCandidates(),
    recentScores: p.recentScores
  })
}
