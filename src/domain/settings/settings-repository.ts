/** Puerto de configuracion persistente (clave-valor). */
export interface SettingsRepository {
  get(key: string): string | null
  set(key: string, value: string): void
}

/** Claves conocidas, para no dispersar strings sueltos por el codigo. */
export const SETTINGS_KEYS = {
  operationMode: 'operation_mode',
  activeProjectId: 'active_project_id',
  authSource: 'auth_source',
  budgetPerRun: 'budget_per_run_usd',
  budgetPerDay: 'budget_per_day_usd',
  encryptedApiKey: 'encrypted_api_key'
} as const

/**
 * Claves que el renderer puede leer y escribir. `encrypted_api_key` queda
 * FUERA a proposito: los handlers settings:get y settings:set aceptaban
 * cualquier clave, asi que desde el renderer se podia leer la key cifrada y
 * sobrescribirla. La key entra por su propio canal, se cifra en el main y no
 * vuelve a salir; esta lista es lo que hace que eso siga siendo cierto.
 */
const PUBLIC_KEYS: ReadonlySet<string> = new Set([
  SETTINGS_KEYS.operationMode,
  SETTINGS_KEYS.activeProjectId,
  SETTINGS_KEYS.authSource,
  SETTINGS_KEYS.budgetPerRun,
  SETTINGS_KEYS.budgetPerDay
])

export function isPublicSettingKey(key: string): boolean {
  return PUBLIC_KEYS.has(key)
}
