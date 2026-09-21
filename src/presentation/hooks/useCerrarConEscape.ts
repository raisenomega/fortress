import { useEffect } from 'react'

/**
 * Escape cierra el dialogo. Es lo que cualquiera prueba primero, y sin ello la
 * unica salida por teclado era llegar con Tab hasta la X.
 *
 * Llama al MISMO `onClose` que ya dispara el clic en el fondo, asi que no abre
 * ninguna via de cierre que el dialogo no tuviera: quien bloquee su `onClose`
 * mientras trabaja sigue bloqueandolo tambien aqui.
 *
 * En `document` y no en la caja: el foco puede estar en un hijo, y un `keydown`
 * de React sobre el `div` no lo veria si el hijo lo para.
 */
export function useCerrarConEscape(onClose: () => void): void {
  useEffect(() => {
    const alPulsar = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [onClose])
}
