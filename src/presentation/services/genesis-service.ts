import { genesisConfigured, parseGenesisBudget } from '@domain/settings/genesis-budget'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import { api } from '../adapters/fortress-api'
import { useGenesisStore } from '../stores/genesis-store'

/** Suscribe al estado del bucle, empujado desde el main. Devuelve el unsubscribe. */
export function subscribeGenesis(): () => void {
  return api().system.onGenesisStatus((status) => useGenesisStore.getState().setStatus(status))
}

/** Lee los topes para saber si el toggle se puede encender. */
export async function loadGenesisConfigured(): Promise<void> {
  const cost = await api().settings.get(SETTINGS_KEYS.genesisCostCap)
  const episodes = await api().settings.get(SETTINGS_KEYS.genesisMaxEpisodes)
  useGenesisStore.getState().setConfigured(genesisConfigured(parseGenesisBudget(cost, episodes)))
}

/** Enciende o apaga el bucle de genesis. */
export async function toggleGenesis(on: boolean): Promise<void> {
  await api().system.genesisToggle(on)
}
