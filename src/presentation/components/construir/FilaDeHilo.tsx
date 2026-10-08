import type { HiloDeChat } from '@domain/chat/hilo-de-chat'
import { elegirHilo } from '../../services/barra-del-chat'

interface FilaDeHiloProps {
  readonly hilo: HiloDeChat
  readonly elegido: boolean
}

/** Una fila clicable de la barra: el clic MANDA (elegirHilo fija la
 *  seleccion viva); el elegido se pinta en dorado. */
export function FilaDeHilo({ hilo, elegido }: FilaDeHiloProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={() => void elegirHilo(hilo)}
      className={`truncate rounded px-2 py-1 text-left text-sm hover:bg-primary/10 ${
        elegido ? 'text-primary' : 'text-foreground'
      }`}
    >
      {hilo.titulo}
    </button>
  )
}
