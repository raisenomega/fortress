import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import { getAppContext } from '../persistence/app-context'
import { requestKeepAwake } from './keep-awake'

/**
 * Devuelve el candado que el operador dejo pedido antes de cerrar. Falla suave:
 * un problema leyendo la preferencia no puede impedir que la app arranque.
 */
export function restoreKeepAwake(): void {
  try {
    if (getAppContext().settings.get(SETTINGS_KEYS.keepAwake) === 'true') {
      requestKeepAwake('operator')
    }
  } catch (error) {
    console.error('[keep-awake] no se pudo restaurar la preferencia', error)
  }
}
