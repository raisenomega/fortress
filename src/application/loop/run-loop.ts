import type { LoopStopReason } from '@domain/loop/loop-decision'
import type { LoopPhase } from '@domain/loop/loop-status'
import type { LoopConfig, LoopDeps } from './loop-deps'
import { freshProgress, nextStop, recordScore, statusOf, type Progress } from './loop-progress'

const WAIT_AFTER_SCAN = 5000
const WAIT_AFTER_FIX = 10000

/**
 * El ciclo del loop, con TODO lo real inyectado. No conoce Electron, procesos
 * ni git: por eso se prueba con dobles. Y ya no necesita saber de git: el
 * arreglo no toca este arbol, asi que no hay checkpoint que poner ni nada que
 * revertir. Parar lo decide loopStop, mas la intervencion humana.
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

    emit('reparando')
    await deps.fix(0)

    emit('escaneando')
    // El re-escaneo ya no juzga el arreglo: lo juzgan el gate y el revisor,
    // dentro del worktree y antes de que nada toque este arbol. Aqui solo se
    // anota, y el arco de los ultimos scores dice si el conjunto va a mejor.
    const after = await deps.scan()

    p.cyclesDone += 1
    record(after)
    emit('esperando')
    await deps.wait(WAIT_AFTER_FIX)
  }
}
