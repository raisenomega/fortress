import { Icon } from '../common/Icon'
import { reportarAlChat } from '../../services/reporte-del-turno'
import { useChatStore } from '../../stores/chat-store'

interface ReportarAlChatProps {
  readonly projectId: string
}

/** El carril de VUELTA (PASO 87), gemelo del Transferir: lleva el
 *  ReporteDeTarea del ultimo turno terminado a la vista del CTO. Sin reporte
 *  no se pinta — navegar sin carga seria el salto vacio de siempre. */
export function ReportarAlChat({ projectId }: ReportarAlChatProps): React.JSX.Element | null {
  const reporte = useChatStore((s) => s.reporteByProject[projectId])
  if (reporte === undefined) return null
  return (
    <button
      type="button"
      onClick={() => reportarAlChat(projectId)}
      title="Llevar el resultado de este turno a la vista Chat"
      className="tap mt-2 inline-flex items-center gap-1 self-start rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20"
    >
      <Icon name="send" size={11} />
      Reportar al Chat
    </button>
  )
}
