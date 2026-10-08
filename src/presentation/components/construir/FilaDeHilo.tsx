import { useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import type { HiloDeChat } from '@domain/chat/hilo-de-chat'
import { elegirHilo } from '../../services/barra-del-chat'
import { MenuDeHilo } from './MenuDeHilo'

interface FilaDeHiloProps {
  readonly hilo: HiloDeChat
  readonly elegido: boolean
}

/** Una fila clicable de la barra: el clic MANDA (elegirHilo fija la
 *  seleccion viva); el elegido en dorado. El ⋯ abre su gestion (121). */
export function FilaDeHilo({ hilo, elegido }: FilaDeHiloProps): React.JSX.Element {
  const [menu, setMenu] = useState(false)
  return (
    <div className="group relative flex items-center">
      <button
        type="button"
        onClick={() => void elegirHilo(hilo)}
        className={`min-w-0 flex-1 truncate rounded px-2 py-1 text-left text-sm hover:bg-primary/10 ${
          elegido ? 'text-primary' : 'text-foreground'
        }`}
      >
        {hilo.titulo}
      </button>
      <button
        type="button"
        aria-label={`Gestionar ${hilo.titulo}`}
        onClick={() => setMenu(true)}
        className="shrink-0 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-primary/10 focus-visible:opacity-100"
      >
        <MoreHorizontal size={13} aria-hidden />
      </button>
      {menu && <MenuDeHilo hilo={hilo} onCerrar={() => setMenu(false)} />}
    </div>
  )
}
