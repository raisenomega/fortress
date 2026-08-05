import type { AppContext } from '@application/context'
import { runGenesis } from '@application/system/run-genesis'
import { readGenesisBudget } from '@application/settings/read-genesis-budget'
import { genesisConfigured } from '@domain/settings/genesis-budget'
import { buildGenesisRuntime } from './genesis-deps'
import { sendGenesisStatus } from './genesis-registry'

/**
 * Motor del bucle de genesis: lee los topes, corre runGenesis con lo real y emite
 * el estado final. No arranca sin topes (genesisConfigured es el freno duro).
 */
export async function runGenesisEngine(context: AppContext): Promise<void> {
  const budget = readGenesisBudget(context)
  if (!genesisConfigured(budget)) return
  const runtime = buildGenesisRuntime(context, budget)
  const stopReason = await runGenesis(runtime.deps, budget)
  sendGenesisStatus({
    phase: 'parado',
    episodesDone: runtime.episodes(),
    spentSession: runtime.spent(),
    costCap: budget.costCapUsd,
    maxEpisodes: budget.maxEpisodes,
    stopReason
  })
}
