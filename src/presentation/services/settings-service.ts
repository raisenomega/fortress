import { parseOperationMode, type OperationMode } from '@domain/settings/operation-mode'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
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

/** El modo elegido sobrevive al reinicio; ante un valor raro cae a supervisado. */
export async function loadOperationMode(): Promise<void> {
  const stored = await api().settings.get(SETTINGS_KEYS.operationMode)
  useSettingsStore.getState().setMode(parseOperationMode(stored))
}

export async function changeOperationMode(mode: OperationMode): Promise<void> {
  useSettingsStore.getState().setMode(mode)
  await api().settings.set(SETTINGS_KEYS.operationMode, mode)
}
