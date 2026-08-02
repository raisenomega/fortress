import { useChatStore, useProjectMessages } from '../../stores/chat-store'
import { useActiveProject } from '../../stores/project-store'
import { EmptyState } from '../common/EmptyState'
import { ChatErrorBanner } from './ChatErrorBanner'
import { ChatInput } from './ChatInput'
import { ChatMessageList } from './ChatMessageList'

interface ChatWindowProps {
  readonly onSend: (text: string) => void
}

export function ChatWindow({ onSend }: ChatWindowProps): React.JSX.Element {
  const project = useActiveProject()
  const messages = useProjectMessages(project?.id ?? null)
  const streaming = useChatStore((state) => state.streaming)
  const error = useChatStore((state) => state.error)
  const setError = useChatStore((state) => state.setError)

  if (!project) {
    return (
      <EmptyState
        icon="🏰"
        title="Ningun proyecto seleccionado"
        hint="Agrega un proyecto desde la barra lateral para abrir su chat. Cada proyecto guarda su propio historial."
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error ? <ChatErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

      {messages.length === 0 ? (
        <div className="flex-1">
          <EmptyState
            icon="💬"
            title={`Chat de ${project.name}`}
            hint="Este historial es exclusivo de este proyecto. Empieza con una accion rapida o escribe tu peticion."
          />
        </div>
      ) : (
        <ChatMessageList messages={messages} />
      )}

      <ChatInput disabled={streaming} onSend={onSend} />
    </div>
  )
}
