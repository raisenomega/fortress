import type { LoopStopReason } from '@domain/loop/loop-decision'
import type { LoopPhase } from '@domain/loop/loop-status'
import type { LoopConfig, LoopDeps } from './loop-deps'
import { freshProgress, nextStop, statusOf, type Progress } from './loop-progress'

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

  for (;;) {
    const pre = nextStop(config, deps, p)
    if (pre) return halt(pre)

    emit('escaneando')
    p.score = await deps.scan()
    p.recentScores.unshift(p.score)
    deps.persist(p.recentScores, p.cyclesDone)
    const post = nextStop(config, deps, p)
    if (post) return halt(post)

    emit('esperando')
    await deps.wait(WAIT_AFTER_SCAN)
    if (deps.isCancelled()) return halt('detenido')

    emit('reparando')
    await deps.snapshot()
    await deps.fix()
    emit('verificando')
    if (!(await deps.verify())) return await deps.revert().then(() => halt('build-roto'))

    p.cyclesDone += 1
    deps.persist(p.recentScores, p.cyclesDone)
    emit('esperando')
    await deps.wait(WAIT_AFTER_FIX)
  }
}
