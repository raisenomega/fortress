import type { FortressApi } from '../../preload/api-types'

/**
 * Unico punto donde la UI toca el puente del preload. Centralizarlo evita
 * que los componentes dependan de `window` y deja un solo sitio que ajustar
 * si el contrato cambia.
 */
export function api(): FortressApi {
  if (!window.api) {
    throw new Error('El puente del preload no esta disponible')
  }
  return window.api
}
