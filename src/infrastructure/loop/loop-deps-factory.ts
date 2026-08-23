import type { AppContext } from '@application/context'
import type { LoopConfig, LoopDeps } from '@application/loop/loop-deps'
import { spentTodayByProject } from '@application/settings/read-budget'
import { readLoopBudget } from '@application/settings/read-loop-budget'
import { loopScan } from './loop-ops'
import { runMotorChain } from '@application/repair/run-motor-chain'
import { describir } from '@application/repair/motor-chain-outcome'
import { buildMotorChainDeps } from '../repair/motor-chain-deps'
import { isLoopCancelled, sendLoopChunk, sendLoopStatus, waitOrCancel } from './loop-registry'
import { withStandby, type StandbyHooks } from './loop-standby'

export interface EngineParams {
  readonly context: AppContext
  readonly config: LoopConfig
  /** spentToday cuando arranco la sesion: la base del tope de sesion. */
  readonly baseline: number
  /** Modo hasta-gate: el motor recorre y acumula, pero no integra. Lo decide
   *  `esHastaGate` en el dominio, no este arranque. */
  readonly hastaGate: boolean
  readonly onStandby: (error: string) => void
  readonly persist: (recentScores: readonly number[], cyclesDone: number) => void
}

/**
 * Arma los puertos reales del ciclo. scan y fix van envueltos en withStandby: un
 * fallo transitorio no mata el loop, lo deja en standby hasta recuperarse.
 * Ya no arma red git: el motor trabaja en su worktree y este arbol no se toca.
 */
export function buildDeps(params: EngineParams): LoopDeps {
  const { context, config, baseline } = params
  const pid = config.projectId
  const hooks: StandbyHooks = {
    isCancelled: () => isLoopCancelled(pid),
    onStandby: params.onStandby,
    waitOrCancel: (ms) => waitOrCancel(pid, ms)
  }

  // La salida en vivo del scan y de los agentes se reenvia al chat del proyecto:
  // el operador lee lo que hacen, como en una corrida normal. No un chat vacio.
  const toChat = (delta: string): void => sendLoopChunk(pid, delta)

  return {
    scan: () =>
      withStandby(() => {
        toChat('\n\n— Escaneando el proyecto —\n')
        return loopScan(context, pid, toChat)
      }, hooks),
    fix: () =>
      withStandby(async () => {
        toChat('\n\n— Motor —\n')
        const vuelta = await runMotorChain(
          context,
          pid,
          buildMotorChainDeps(pid),
          params.hastaGate ? 'hasta-gate' : 'completo'
        )
        if (vuelta.ok) toChat(`${describir(vuelta.value)}\n`)
        return vuelta
      }, hooks),
    spentSession: () => spentTodayByProject(context, new Date(), pid) - baseline,
    maxConsecutiveDenials: () => readLoopBudget(context).maxConsecutiveDenials,
    rescanEvery: () => readLoopBudget(context).rescanEvery,
    maxConsecutiveNoCandidates: () => readLoopBudget(context).maxConsecutiveNoCandidates,
    maxConsecutiveDiscarded: () => readLoopBudget(context).maxConsecutiveDiscarded,
    isCancelled: () => isLoopCancelled(pid),
    wait: (ms) => waitOrCancel(pid, ms),
    emit: sendLoopStatus,
    persist: params.persist
  }
}
