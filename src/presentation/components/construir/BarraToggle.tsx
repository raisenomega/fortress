import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useBarraStore } from '../../stores/barra-store'

/** Icono arriba-izquierda de la pagina de Chat: abre/cierra SU barra (store
 *  propio — la barra principal ni se entera). Molde de SidebarToggle. */
export function BarraToggle(): React.JSX.Element {
  const abierta = useBarraStore((s) => s.abierta)
  const toggle = useBarraStore((s) => s.toggle)

  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={abierta}
      title={abierta ? 'Cerrar la barra del chat' : 'Abrir la barra del chat'}
      className="tap shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
    >
      {abierta ? <PanelLeftClose size={15} aria-hidden /> : <PanelLeftOpen size={15} aria-hidden />}
    </button>
  )
}
