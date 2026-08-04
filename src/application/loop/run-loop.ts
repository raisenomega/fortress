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
  const record = (score: number): void => {
    p.score = score
    p.recentScores.unshift(score)
    deps.persist(p.recentScores, p.cyclesDone)
  }

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
    await deps.fix()
    emit('verificando')
    if (!(await deps.verify())) return await deps.revert().then(() => halt('build-roto'))

    emit('escaneando')
    const after = await deps.scan()
    // El arreglo se mide por el re-escaneo: si baja el score, revierte y para.
    if (after < before) return await deps.revert().then(() => halt('degradado'))

    p.cyclesDone += 1
    record(after)
    emit('esperando')
    await deps.wait(WAIT_AFTER_FIX)
  }
}
