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
  loopCostCap: 'loop_cost_cap_usd',
  loopMaxCycles: 'loop_max_cycles',
  loopMaxDenials: 'loop_max_consecutive_denials',
  loopRescanEvery: 'loop_rescan_every',
  loopMaxNoCandidates: 'loop_max_consecutive_no_candidates',
  loopMaxDiscarded: 'loop_max_consecutive_discarded',
  keepAwake: 'keep_awake',
  genesisCostCap: 'genesis_cost_cap_usd',
  genesisMaxEpisodes: 'genesis_max_episodes',
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
  SETTINGS_KEYS.budgetPerDay,
  SETTINGS_KEYS.loopCostCap,
  SETTINGS_KEYS.loopMaxCycles,
  SETTINGS_KEYS.loopMaxDenials,
  SETTINGS_KEYS.loopRescanEvery,
  SETTINGS_KEYS.loopMaxNoCandidates,
  SETTINGS_KEYS.loopMaxDiscarded,
  SETTINGS_KEYS.keepAwake,
  SETTINGS_KEYS.genesisCostCap,
  SETTINGS_KEYS.genesisMaxEpisodes
])

export function isPublicSettingKey(key: string): boolean {
  return PUBLIC_KEYS.has(key)
}
