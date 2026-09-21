import { useEffect, type RefObject } from 'react'
import { saltoDelTab } from './salto-del-tab'

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Tab y Shift+Tab dan la vuelta DENTRO de la caja. Sin enfocables no hay a
 *  donde ir, y se corta para que el foco no se vaya a la pagina de detras. */
function retenerElTab(caja: HTMLElement, event: KeyboardEvent): void {
  if (event.key !== 'Tab') return
  const lista = [...caja.querySelectorAll<HTMLElement>(ENFOCABLES)]
  if (lista.length === 0) return event.preventDefault()

  const activo = lista.indexOf(document.activeElement as HTMLElement)
  const destino = saltoDelTab(lista.length, activo, event.shiftKey)
  if (destino === null) return
  event.preventDefault()
  lista[destino]?.focus()
}

/**
 * Lo que `aria-modal` PROMETE y un `<div>` no hace solo: llevar el foco al
 * dialogo al abrirse, no dejarlo salir mientras esta abierto y devolverlo a
 * quien lo abrio al cerrarse. Declarar `aria-modal` sin esto es peor que no
 * declararlo — el lector anuncia un modal y el Tab se pasea por la pagina de
 * detras, que ademas esta tapada.
 *
 * El foco inicial va a la CAJA (`tabIndex={-1}`), no al primer boton: en los
 * dialogos de confirmar, el primero suele ser el destructivo, y dejarlo armado
 * bajo el Enter de quien acaba de abrirlo es regalar un clic que nadie dio. Si
 * un hijo ya lo pidio con `autoFocus` —el campo de la API key, el nombre del
 * proyecto— se le respeta: React lo enfoca antes de que corra este efecto.
 */
export function useFocoDelDialogo(caja: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const nodo = caja.current
    if (nodo === null) return
    const previo = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!nodo.contains(document.activeElement)) nodo.focus()

    const alPulsar = (event: KeyboardEvent): void => retenerElTab(nodo, event)
    document.addEventListener('keydown', alPulsar)
    return () => {
      document.removeEventListener('keydown', alPulsar)
      // `isConnected`: quien lo abrio pudo desaparecer mientras tanto (la fila
      // que se acaba de retirar). Enfocar un nodo suelto no falla: no hace nada
      // y el foco se pierde en `body`, que es justo lo que esto viene a evitar.
      if (previo?.isConnected) previo.focus()
    }
  }, [caja])
}
