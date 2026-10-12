import { useSaltoStore } from '../../stores/salto-store'
import { Icon } from '../common/Icon'

const MENSAJE = {
  'al-terminal': 'El CTO propuso un PASO — salta solo al Terminal en unos segundos.',
  'al-cto': 'El Terminal terminó — su reporte vuelve solo al CTO en unos segundos.'
} as const

/**
 * El aviso de la ventana del salto automatico del lazo (Sello 2b): el salto —al
 * Terminal (2b-a) o de vuelta al CTO (2b-b)— se ve aqui antes de irse, con tiempo
 * para cancelarlo. Sin esto la ventana viviria solo en el temporizador,
 * invisible, y «Detener en los 5s» no tendria donde pulsarse. Va en las DOS
 * vistas (CTO y Terminal) para verse desde donde este el operador.
 */
export function VentanaDelSalto(): React.JSX.Element | null {
  const pendiente = useSaltoStore((s) => s.pendiente)
  const rumbo = useSaltoStore((s) => s.rumbo)
  const cancelar = useSaltoStore((s) => s.cancelar)
  if (!pendiente || rumbo === null) return null

  return (
    <div
      role="status"
      className="bg-medium/10 text-medium flex shrink-0 items-center gap-2 border-t border-border px-4 py-2 text-xs"
    >
      <Icon name="send" size={13} />
      <span className="flex-1">{MENSAJE[rumbo]}</span>
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
