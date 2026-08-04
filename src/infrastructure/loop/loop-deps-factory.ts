import type { AppContext } from '@application/context'
import type { LoopConfig, LoopDeps } from '@application/loop/loop-deps'
import { spentToday } from '@application/settings/read-budget'
import type { OperationMode } from '@domain/settings/operation-mode'
import { loopScan, loopWork } from './loop-ops'
import { isLoopCancelled, sendLoopStatus, waitOrCancel } from './loop-registry'
import { withStandby, type StandbyHooks } from './loop-standby'

export interface EngineParams {
  readonly context: AppContext
  readonly config: LoopConfig
  /** supervisado = auditoria (no edita); autonomo = reparacion (edita). */
  readonly mode: OperationMode
  /** spentToday cuando arranco la sesion: la base del tope de sesion. */
  readonly baseline: number
  readonly onStandby: (error: string) => void
  readonly persist: (recentScores: readonly number[], cyclesDone: number) => void
}

/**
 * Arma los puertos reales del ciclo. scan y fix van envueltos en withStandby:
 * un fallo transitorio no mata el loop, lo deja en standby hasta recuperarse.
 * verify/snapshot/revert son inertes en auditoria; el Inc 5 los hace de verdad.
 */
export function buildDeps(params: EngineParams): LoopDeps {
  const { context, config, mode, baseline } = params
  const pid = config.projectId
  const hooks: StandbyHooks = {
    isCancelled: () => isLoopCancelled(pid),
    onStandby: params.onStandby,
    waitOrCancel: (ms) => waitOrCancel(pid, ms)
  }

  return {
    scan: () => withStandby(() => loopScan(context, pid, () => {}), hooks),
    fix: () => withStandby(() => loopWork(context, pid, mode, () => {}), hooks),
    verify: () => Promise.resolve(true),
    snapshot: () => Promise.resolve(),
    revert: () => Promise.resolve(),
    spentSession: () => spentToday(context, new Date()) - baseline,
    isCancelled: () => isLoopCancelled(pid),
    wait: (ms) => waitOrCancel(pid, ms),
    emit: sendLoopStatus,
    persist: params.persist
  }
}
