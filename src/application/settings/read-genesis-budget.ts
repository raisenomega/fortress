import { parseGenesisBudget, type GenesisBudget } from '@domain/settings/genesis-budget'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import type { AppContext } from '../context'

/** Lee los topes del bucle de genesis desde settings. */
export function readGenesisBudget(context: AppContext): GenesisBudget {
  return parseGenesisBudget(
    context.settings.get(SETTINGS_KEYS.genesisCostCap),
    context.settings.get(SETTINGS_KEYS.genesisMaxEpisodes)
  )
}
