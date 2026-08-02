import type { Assistant } from '@domain/chat/assistant'
import type { SettingsRepository } from '@domain/settings/settings-repository'
import { err, ok, type Result } from '@domain/shared/result'
import { readApiKey } from '../security/api-key-store'
import { createAnthropicAssistant } from './anthropic-assistant'

const MISSING_KEY =
  'No hay API key de Claude configurada. Abrela en Ajustes o exporta ANTHROPIC_API_KEY.'

/**
 * Resuelve el asistente en el momento de usarlo: asi un cambio de key surte
 * efecto sin reiniciar, y la key nunca se queda cacheada de mas.
 */
export function resolveAssistant(settings: SettingsRepository): Result<Assistant> {
  const apiKey = readApiKey(settings)
  if (!apiKey) return err(MISSING_KEY)
  return ok(createAnthropicAssistant(apiKey))
}
