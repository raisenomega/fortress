import type { LoopStopReason } from '@domain/loop/loop-decision'
import type { LoopPhase } from '@domain/loop/loop-status'
import { runDebate } from './debate'
import type { LoopConfig, LoopDeps } from './loop-deps'
import { freshProgress, nextStop, recordScore, statusOf, type Progress } from './loop-progress'

const WAIT_AFTER_SCAN = 5000
const WAIT_AFTER_FIX = 10000

/**
 * El ciclo del loop, con TODO lo real inyectado. No conoce Electron, procesos
 * ni git: por eso se prueba con dobles. loopStop es el unico que decide parar,
 * salvo el build roto, que se revierte y detiene aqui mismo.
 */
export async function runLoop(
  config: LoopConfig,
  deps: LoopDeps,
  initial?: Progress
): Promise<LoopStopReason> {
  const p: Progress = initial ?? freshProgress()
  const emit = (phase: LoopPhase, reason: LoopStopReason | null = null): void =>
    deps.emit(statusOf(config, deps, p, phase, reason))
  const halt = (reason: LoopStopReason): LoopStopReason => (emit('parado', reason), reason)
  const record = (score: number): void => recordScore(deps, p, score)

  const pre = nextStop(config, deps, p)
  if (pre) return halt(pre)
  emit('escaneando')
  record(await deps.scan()) // escaneo base: el punto de partida del arco

  for (;;) {
    const stop = nextStop(config, deps, p)
    if (stop) return halt(stop)

    emit('esperando')
    await deps.wait(WAIT_AFTER_SCAN)
    if (deps.isCancelled()) return halt('detenido')

    const before = p.recentScores[0]
    emit('reparando')
    await deps.snapshot()
    await deps.fix(0)
    emit('verificando')
    if (!(await deps.verify())) return await deps.revert().then(() => halt('build-roto'))

    emit('escaneando')
    let after = await deps.scan()
    // El arreglo se mide por el re-escaneo. Si baja, se abre el DEBATE: prueba
    // alternativas y se queda con la que mejore; si ninguna, se rinde y para.
    if (after < before) {
      const outcome = await runDebate(config, deps, p, before)
      if (outcome.score === null) return halt(outcome.reason ?? 'sin-solucion')
      after = outcome.score
    }

    p.cyclesDone += 1
    record(after)
    emit('esperando')
    await deps.wait(WAIT_AFTER_FIX)
  }
}
