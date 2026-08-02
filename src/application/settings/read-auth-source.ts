import { parseAuthSource, type AuthSource } from '@domain/settings/auth-source'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import type { AppContext } from '../context'

/** Con que credenciales se ejecuta. Por defecto, la suscripcion. */
export function readAuthSource(context: AppContext): AuthSource {
  return parseAuthSource(context.settings.get(SETTINGS_KEYS.authSource))
}

/** Verdadero solo si hay key Y el operador eligio usarla. */
export function usesApiKey(context: AppContext): boolean {
  return readAuthSource(context) === 'api-key' && context.apiKeys.has()
}
