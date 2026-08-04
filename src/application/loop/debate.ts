import type { LoopStopReason } from '@domain/loop/loop-decision'
import type { LoopConfig, LoopDeps } from './loop-deps'
import { statusOf, type Progress } from './loop-progress'

/** Rondas del debate: intentos alternativos antes de rendirse. Cada uno cuesta
 *  un arreglo + un escaneo, asi que va acotado. */
const MAX_ROUNDS = 2

export interface DebateOutcome {
  /** Score mejorado si el debate hallo solucion; null si se rindio. */
  readonly score: number | null
  /** Motivo de parada si se rindio (sin-solucion / detenido); null si mejoro. */
  readonly reason: LoopStopReason | null
}

/**
 * Debate juez/defensa: un arreglo bajo el score. Se revierte y se prueban
 * alternativas —cada intento avisa al agente de que el anterior empeoro—. El
 * JUEZ es el re-escaneo objetivo, no un LLM: se queda con el primer intento que
 * SUPERE el score previo. Si ninguno mejora en MAX_ROUNDS, se rinde y para.
 */
export async function runDebate(
  config: LoopConfig,
  deps: LoopDeps,
  progress: Progress,
  before: number
): Promise<DebateOutcome> {
  await deps.revert() // deshace el arreglo que empeoro
  for (let attempt = 1; attempt <= MAX_ROUNDS; attempt += 1) {
    if (deps.isCancelled()) return { score: null, reason: 'detenido' }
    deps.emit(statusOf(config, deps, progress, 'debate', null))
    await deps.snapshot()
    await deps.fix(attempt)
    if (!(await deps.verify())) {
      await deps.revert()
      continue
    }
    const score = await deps.scan()
    if (score > before) return { score, reason: null } // el juez lo acepta
    await deps.revert() // este tampoco mejora: deshacer
  }
  return { score: null, reason: 'sin-solucion' }
}
