import { api } from '../adapters/fortress-api'
import { useSettingsStore } from '../stores/settings-store'

/** Consulta si hay API key utilizable (guardada cifrada o via ANTHROPIC_API_KEY). */
export async function refreshApiKeyStatus(): Promise<void> {
  useSettingsStore.getState().setHasApiKey(await api().settings.hasApiKey())
}

/** Devuelve el error si no se pudo guardar, o null si todo fue bien. */
export async function saveApiKey(plainKey: string): Promise<string | null> {
  const result = await api().settings.saveApiKey(plainKey)
  if (!result.ok) return result.error

  await refreshApiKeyStatus()
  return null
}

export async function clearApiKey(): Promise<void> {
  await api().settings.clearApiKey()
  await refreshApiKeyStatus()
}
