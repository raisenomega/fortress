import type { ApiKeyVerdict } from '@domain/settings/api-key-check'
import { parseOperationMode, type OperationMode } from '@domain/settings/operation-mode'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import type { Result } from '@domain/shared/result'
import { api } from '../adapters/fortress-api'
import { useSettingsStore } from '../stores/settings-store'
import { useUiStore } from '../stores/ui-store'
import { loadProjects } from './project-service'

/** Consulta si hay API key utilizable (guardada cifrada o via ANTHROPIC_API_KEY). */
export async function refreshApiKeyStatus(): Promise<void> {
  useSettingsStore.getState().setHasApiKey(await api().settings.hasApiKey())
}

/** Valida contra la API y guarda si procede; devuelve el veredicto para la UI. */
export async function saveApiKey(plainKey: string): Promise<Result<ApiKeyVerdict>> {
  const result = await api().settings.saveApiKey(plainKey)
  if (result.ok) await refreshApiKeyStatus()
  return result
}

/** Revalida la key ya guardada contra la API real. */
export function checkApiKey(): Promise<ApiKeyVerdict> {
  return api().settings.checkApiKey()
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
  // Al activar autonomo el aviso vuelve: entonces es una advertencia, no un
  // recordatorio que ya se leyo.
  if (mode === 'autonomo') useUiStore.getState().showAutonomousNotice()

  useSettingsStore.getState().setMode(mode)
  await api().settings.set(SETTINGS_KEYS.operationMode, mode)
  // El efecto por proyecto (encabezado del Chat) se hornea en `projects:list`
  // leyendo el modo persistido: sin recargar, el toggle no refrescaria la
  // izquierda hasta la siguiente mutacion de proyecto (PASO 152).
  await loadProjects()
}
