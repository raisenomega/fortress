import { parseAuthSource, type AuthSource } from '@domain/settings/auth-source'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import { api } from '../adapters/fortress-api'
import { useAccountStore } from '../stores/account-store'
import { reportError } from '../stores/toast-store'
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

let connecting = false

/** El CLI abre el navegador; su salida se va pintando por si pide un codigo.
 *  El listener se suelta cuando login() resuelve (al cerrar el proceso), no con
 *  un temporizador; el guard evita apilar listeners si se pulsa dos veces. */
export async function connectAccount(): Promise<void> {
  if (connecting) return
  connecting = true
  useAccountStore.getState().clearOutput()

  const stop = api().account.onOutput((text) => useAccountStore.getState().appendOutput(text))
  try {
    await api().account.login()
  } catch (error) {
    reportError(error instanceof Error ? error.message : 'No se pudo conectar la cuenta')
  } finally {
    stop()
    connecting = false
    await loadAccount()
  }
}
