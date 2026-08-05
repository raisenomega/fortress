import type { AppContext } from '@application/context'
import { promoteCapability } from '@application/system/promote-capability'
import type { GenesisDeps } from '@application/system/run-genesis'
import type { GenesisBudget } from '@domain/settings/genesis-budget'
import { isGenesisCancelled, sendGenesisStatus, waitOrCancel } from './genesis-registry'
import { nextGenesisCapability, runGenesisEpisode } from './genesis-ops'

export interface GenesisRuntime {
  readonly deps: GenesisDeps
  spent(): number
  episodes(): number
}

/**
 * Cablea los puertos del bucle con lo real: episodios en sandbox con coste real,
 * y promocion de lo reversible (un agente queda pendiente de firma humana, porque
 * promoteCapability con humanApproved=false no lo cruza). Aparte de la seguridad.
 */
export function buildGenesisRuntime(
  context: AppContext,
  budget: GenesisBudget,
  token: number
): GenesisRuntime {
  let spent = 0
  let episodes = 0
  const deps: GenesisDeps = {
    nextCapability: () => nextGenesisCapability(context),
    runEpisode: (id) =>
      runGenesisEpisode(context, id, (usd) => {
        spent += usd
      }),
    advance: (id) => {
      promoteCapability(context, id, false)
      return Promise.resolve()
    },
    spentSession: () => spent,
    isCancelled: () => isGenesisCancelled(token),
    wait: (ms) => waitOrCancel(ms, token),
    emit: (done) => {
      episodes = done
      sendGenesisStatus({
        phase: 'corriendo',
        episodesDone: done,
        spentSession: spent,
        costCap: budget.costCapUsd,
        maxEpisodes: budget.maxEpisodes,
        stopReason: null
      })
    }
  }
  return { deps, spent: () => spent, episodes: () => episodes }
}
