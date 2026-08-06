import type { LoopConfig } from '@application/loop/loop-deps'
import { solvedStreak } from '@domain/loop/loop-decision'
import type { LoopStatus } from '@domain/loop/loop-status'

/** Estado que persiste entre ciclos del loop de un proyecto. */
export interface Track {
  recentScores: readonly number[]
  cyclesDone: number
}

/** Status "en espera" entre ciclos, para el HUD del loop. */
export function standbyStatus(config: LoopConfig, track: Track, spent: number): LoopStatus {
  return {
    projectId: config.projectId,
    phase: 'standby',
    cycle: track.cyclesDone + 1,
    maxCycles: config.maxCycles,
    score: track.recentScores[0] ?? null,
    spentSession: spent,
    costCap: config.costCap,
    solvedStreak: solvedStreak(track.recentScores),
    stopReason: null
  }
}
