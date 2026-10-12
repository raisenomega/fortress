import type { ChatMessage } from '@domain/chat/chat-message'
import { usePegadoAlFondo } from '../../hooks/usePegadoAlFondo'
import { ChatMessageItem } from './ChatMessageItem'
import { TerminalMessage } from './TerminalMessage'

interface ChatMessageListProps {
  readonly messages: readonly ChatMessage[]
  /** Terminal: pinta cada mensaje como linea de consola en vez de burbuja. */
  readonly terminal?: boolean
  /** Muestra el badge "Transferir" al pie de cada respuesta del agente. */
  readonly transfer?: boolean
  /** Lo que se pinta AL PIE del hilo, dentro del scroll: hoy, el boton de
   *  aprobar el plan del lote. Va aqui y no sobre el input para que sea el pie
   *  del documento —scrollea con el— en vez de una franja fija que lo tape. */
  readonly pie?: React.ReactNode
}

export function ChatMessageList({
  messages,
  terminal,
  transfer,
  pie
}: ChatMessageListProps): React.JSX.Element {
  // Pegado al ultimo mensaje mientras llega el streaming (hook compartido).
  const bottomRef = usePegadoAlFondo(messages)

  const cls = terminal ? 'gap-1.5 px-4 py-3' : 'gap-3 px-4 py-4'

  return (
    <div className={`flex flex-1 flex-col overflow-y-auto ${cls}`}>
      {messages.map((message) =>
        terminal ? (
          <TerminalMessage key={message.id} message={message} />
        ) : (
          <ChatMessageItem key={message.id} message={message} transfer={transfer} />
        )
      )}
      {pie}
      <div ref={bottomRef} />
    </div>
  )
}
