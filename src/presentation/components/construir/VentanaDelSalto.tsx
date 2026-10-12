import { useSaltoStore } from '../../stores/salto-store'
import { Icon } from '../common/Icon'

/**
 * El aviso de la ventana del salto automatico (Sello 2b-a): cuando el CTO
 * propone un PASO en modo autonomo, salta solo al Terminal — pero antes se ve
 * aqui, con tiempo para cancelarlo. Sin esto la ventana viviria solo en el
 * temporizador, invisible, y «Detener en los 5s» no tendria donde pulsarse.
 */
export function VentanaDelSalto(): React.JSX.Element | null {
  const pendiente = useSaltoStore((s) => s.pendiente)
  const cancelar = useSaltoStore((s) => s.cancelar)
  if (!pendiente) return null

  return (
    <div
      role="status"
      className="bg-medium/10 text-medium flex shrink-0 items-center gap-2 border-t border-border px-4 py-2 text-xs"
    >
      <Icon name="send" size={13} />
      <span className="flex-1">
        El CTO propuso un PASO — salta solo al Terminal en unos segundos.
      </span>
      <button
        type="button"
        onClick={cancelar}
        className="tap border-medium/50 rounded-full border px-2.5 py-1 font-medium hover:bg-medium/20"
      >
        Cancelar
      </button>
    </div>
  )
}
