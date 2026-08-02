/** Puerto de configuracion persistente (clave-valor). */
export interface SettingsRepository {
  get(key: string): string | null
  set(key: string, value: string): void
}

/** Claves conocidas, para no dispersar strings sueltos por el codigo. */
export const SETTINGS_KEYS = {
  operationMode: 'operation_mode',
  activeProjectId: 'active_project_id',
  encryptedApiKey: 'encrypted_api_key'
} as const
