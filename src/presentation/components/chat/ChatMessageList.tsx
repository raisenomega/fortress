import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@domain/chat/chat-message'
import { ChatMessageItem } from './ChatMessageItem'

interface ChatMessageListProps {
  readonly messages: readonly ChatMessage[]
}

export function ChatMessageList({ messages }: ChatMessageListProps): React.JSX.Element {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Mantener la vista pegada al ultimo mensaje mientras llega el streaming.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
      {messages.map((message) => (
        <ChatMessageItem key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
