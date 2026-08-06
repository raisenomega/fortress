import type { KeyboardEvent } from 'react'

/**
 * Enter o Espacio activan un elemento no-boton (una fila clicable). Con esto una
 * lista con onClick tambien responde al teclado, no solo al raton: sin ello los
 * paneles de OMEGA no se pueden abrir sin puntero.
 */
export function onActivate(action: () => void) {
  return (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action()
    }
  }
}
