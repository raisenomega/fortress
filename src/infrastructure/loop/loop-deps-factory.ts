import type { AppContext } from '@application/context'
import type { LoopConfig, LoopDeps } from '@application/loop/loop-deps'
import { spentToday } from '@application/settings/read-budget'
import type { Project } from '@domain/project/project'
import { gitRevert, gitSnapshot } from './loop-git'
import { loopScan } from './loop-ops'
import { loopRepair } from './loop-repair-op'
import { isLoopCancelled, sendLoopStatus, waitOrCancel } from './loop-registry'
import { withStandby, type StandbyHooks } from './loop-standby'
import { loopVerify } from './loop-verify'

export interface EngineParams {
  readonly context: AppContext
  readonly config: LoopConfig
  readonly project: Project
  /** spentToday cuando arranco la sesion: la base del tope de sesion. */
  readonly baseline: number
  readonly onStandby: (error: string) => void
  readonly persist: (recentScores: readonly number[], cyclesDone: number) => void
}

/**
 * Arma los puertos reales del ciclo. scan y fix van envueltos en withStandby: un
 * fallo transitorio no mata el loop, lo deja en standby hasta recuperarse.
 * snapshot/revert son la red git; verify corre typecheck tras el arreglo.
 */
export function buildDeps(params: EngineParams): LoopDeps {
  const { context, config, project, baseline } = params
  const pid = config.projectId
  const cwd = project.path
  let checkpoint: string | null = null
  const hooks: StandbyHooks = {
    isCancelled: () => isLoopCancelled(pid),
    onStandby: params.onStandby,
    waitOrCancel: (ms) => waitOrCancel(pid, ms)
  }

  return {
    scan: () => withStandby(() => loopScan(context, pid, () => {}), hooks),
    fix: () => withStandby(() => loopRepair(context, pid, () => {}), hooks),
    verify: () => loopVerify(cwd),
    snapshot: () => {
      checkpoint = gitSnapshot(cwd)
      return Promise.resolve()
    },
    revert: () => {
      if (checkpoint) gitRevert(cwd, checkpoint)
      return Promise.resolve()
    },
    spentSession: () => spentToday(context, new Date()) - baseline,
    isCancelled: () => isLoopCancelled(pid),
    wait: (ms) => waitOrCancel(pid, ms),
    emit: sendLoopStatus,
    persist: params.persist
  }
}
