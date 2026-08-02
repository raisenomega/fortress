import type { Assistant } from '@domain/chat/assistant'
import type { ApiKeyStore } from '@domain/settings/api-key-store'
import { err, ok, type Result } from '@domain/shared/result'
import { createAnthropicAssistant } from './anthropic-assistant'

const MISSING_KEY =
  'No hay API key de Claude configurada. Abrela en Configuracion o exporta ANTHROPIC_API_KEY.'

/**
 * Resuelve el asistente en el momento de usarlo: asi un cambio de key surte
 * efecto sin reiniciar, y la key nunca se queda cacheada de mas.
 */
export function resolveAssistant(apiKeys: ApiKeyStore): Result<Assistant> {
  const apiKey = apiKeys.read()
  if (!apiKey) return err(MISSING_KEY)
  return ok(createAnthropicAssistant(apiKey))
}
