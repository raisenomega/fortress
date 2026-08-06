import {
  useProjectError,
  useProjectMessages,
  useProjectStreaming
} from '../../stores/chat-selectors'
import { useChatStore } from '../../stores/chat-store'
import { useLoopActive } from '../../stores/loop-store'
import { useActiveProject } from '../../stores/project-store'
import { EmptyState } from '../common/EmptyState'
import { ConfigurationCard } from '../config/ConfigurationCard'
import { ChatBody } from './ChatBody'
import { ChatErrorBanner } from './ChatErrorBanner'
import { stopWorkflow } from '../../services/chat-service'
import { ChatHeader } from './ChatHeader'
import { ChatInput } from './ChatInput'

interface ChatWindowProps {
  readonly onSend: (text: string) => void
}

export function ChatWindow({ onSend }: ChatWindowProps): React.JSX.Element {
  const project = useActiveProject()
  const messages = useProjectMessages(project?.id ?? null)
  const streaming = useProjectStreaming(project?.id ?? null)
  // El loop corre en el main: su actividad tambien pone el chat "en marcha", asi
  // el boton se vuelve el Detener rojo y sirve de parada manual del loop.
  const loopActive = useLoopActive(project?.id ?? null)
  const busy = streaming || loopActive
  const error = useProjectError(project?.id ?? null)
  const setError = useChatStore((state) => state.setError)

  if (!project) {
    return (
      <EmptyState
        iconName="castle"
        title="Ningun proyecto seleccionado"
        hint="Agrega un proyecto desde la barra lateral para abrir su chat. Cada proyecto guarda su propio historial."
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatHeader project={project} />
      {project.configState === 'PENDIENTE_CONFIGURACION' ? (
        <ConfigurationCard projectId={project.id} />
      ) : null}
      {error ? (
        <ChatErrorBanner message={error} onDismiss={() => setError(project.id, null)} />
      ) : null}

      <ChatBody projectName={project.name} messages={messages} />

      <ChatInput
        disabled={busy}
        running={busy}
        onStop={() => project && void stopWorkflow(project.id)}
        onSend={onSend}
      />
    </div>
  )
}
