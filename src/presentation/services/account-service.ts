import { parseAuthSource, type AuthSource } from '@domain/settings/auth-source'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import { api } from '../adapters/fortress-api'
import { useAccountStore } from '../stores/account-store'
import { loadBilling } from './telemetry-service'

export async function loadAccount(): Promise<void> {
  const store = useAccountStore.getState()
  store.setAccount(await api().account.status())
  store.setSource(parseAuthSource(await api().settings.get(SETTINGS_KEYS.authSource)))
}

/**
 * Cambiar de credenciales cambia si el consumo cuesta dinero, asi que se
 * relee la facturacion en el mismo momento y el aviso se actualiza solo.
 */
export async function chooseAuthSource(source: AuthSource): Promise<void> {
  useAccountStore.getState().setSource(source)
  await api().settings.set(SETTINGS_KEYS.authSource, source)
  await loadBilling()
}

/** El CLI abre el navegador; su salida se va pintando por si pide un codigo. */
export async function connectAccount(): Promise<void> {
  const store = useAccountStore.getState()
  store.clearOutput()

  const stop = api().account.onOutput((text) => useAccountStore.getState().appendOutput(text))
  await api().account.login()

  window.setTimeout(() => {
    stop()
    void loadAccount()
  }, 60_000)
}
