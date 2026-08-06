import type { GenesisBudget } from '@domain/settings/genesis-budget'
import { genesisStop, type GenesisStopReason } from '@domain/system/genesis-decision'

const WAIT_MS = 4000

/** Puertos que el engine real cablea; aqui todo es inyectable y testeable. */
export interface GenesisDeps {
  /** Id de la proxima capacidad a avanzar, o null si no queda trabajo. */
  nextCapability: () => string | null
  /** Corre UN episodio de la capacidad (corrida real acotada, en sandbox). */
  runEpisode: (id: string) => Promise<void>
  /** Promueve lo reversible; un agente nuevo se deja pendiente de firma humana. */
  advance: (id: string) => Promise<void>
  spentSession: () => number
  isCancelled: () => boolean
  wait: (ms: number) => Promise<void>
  emit: (episodesDone: number) => void
}

/**
 * El bucle de genesis: entrena una capacidad por iteracion y para en cuanto la
 * decision (topes/humano/sin-trabajo) lo pide. No conoce timers reales ni el
 * agente: los inyecta el engine. La seguridad vive en genesisStop.
 */
export async function runGenesis(
  deps: GenesisDeps,
  budget: GenesisBudget
): Promise<GenesisStopReason> {
  let episodesDone = 0
  for (;;) {
    const id = deps.nextCapability()
    const stop = genesisStop({
      cancelled: deps.isCancelled(),
      spentSession: deps.spentSession(),
      costCap: budget.costCapUsd,
      episodesDone,
      maxEpisodes: budget.maxEpisodes,
      hasWork: id !== null
    })
    if (stop !== null) return stop
    if (id === null) return 'sin-trabajo'
    await deps.runEpisode(id)
    episodesDone += 1
    await deps.advance(id)
    deps.emit(episodesDone)
    await deps.wait(WAIT_MS)
  }
}
