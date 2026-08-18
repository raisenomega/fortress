import type { LoopBudget } from './loop-budget'

/** Un presupuesto completo y valido: los dos frenos duros y las cuatro valvulas. */
export const CONFIGURADO: LoopBudget = {
  costCapUsd: 30,
  maxCycles: 5,
  maxConsecutiveDenials: 5,
  rescanEvery: 3,
  maxConsecutiveNoCandidates: 10,
  maxConsecutiveDiscarded: 3
}
