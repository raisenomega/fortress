import type { ChatMessage } from '@domain/chat/chat-message'
import { EmptyState } from '../common/EmptyState'
import { ChatMessageList } from './ChatMessageList'

interface ChatBodyProps {
  readonly projectName: string
  readonly messages: readonly ChatMessage[]
}

/** El cuerpo del chat: el historial, o el vacio inicial de un proyecto sin turnos. */
export function ChatBody({ projectName, messages }: ChatBodyProps): React.JSX.Element {
  if (messages.length === 0) {
    return (
      <div className="flex-1">
        <EmptyState
          iconName="message-square"
          title={`Terminal de ${projectName}`}
          hint="Este historial es exclusivo de este proyecto. Empieza con una accion rapida o escribe tu peticion."
        />
      </div>
    )
  }
  return <ChatMessageList messages={messages} />
}
