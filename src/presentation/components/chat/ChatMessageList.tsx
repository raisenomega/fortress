import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@domain/chat/chat-message'
import { ChatMessageItem } from './ChatMessageItem'
import { TerminalMessage } from './TerminalMessage'

interface ChatMessageListProps {
  readonly messages: readonly ChatMessage[]
  /** Terminal: pinta cada mensaje como linea de consola en vez de burbuja. */
  readonly terminal?: boolean
  /** Muestra el badge "Transferir" al pie de cada respuesta del agente. */
  readonly transfer?: boolean
}

export function ChatMessageList({
  messages,
  terminal,
  transfer
}: ChatMessageListProps): React.JSX.Element {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Mantener la vista pegada al ultimo mensaje mientras llega el streaming.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

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
      <div ref={bottomRef} />
    </div>
  )
}
