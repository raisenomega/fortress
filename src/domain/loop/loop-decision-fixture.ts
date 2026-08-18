import type { LoopState } from './loop-decision'

/** Un ciclo sano: nada disparado, nada cerca de su tope. */
export const ESTADO_BASE: LoopState = {
  cancelled: false,
  spentSession: 0,
  costCap: 30,
  cyclesDone: 0,
  maxCycles: 5,
  consecutiveDenials: 0,
  maxConsecutiveDenials: 5,
  consecutiveNoCandidates: 0,
  maxConsecutiveNoCandidates: 10,
  consecutiveDiscarded: 0,
  maxConsecutiveDiscarded: 3,
  recentScores: []
}
