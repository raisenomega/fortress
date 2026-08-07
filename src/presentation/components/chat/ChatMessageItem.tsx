import type { ChatMessage } from '@domain/chat/chat-message'
import { MessageChips } from './MessageChips'
import { TransferBadge } from './TransferBadge'

const ROLE_CLASS: Record<ChatMessage['role'], string> = {
  user: 'border-primary/30 bg-accent/20',
  assistant: 'border-border bg-card',
  system: 'border-medium/30 bg-medium/5'
}

const ROLE_LABEL: Record<ChatMessage['role'], string> = {
  user: 'Tu',
  assistant: 'Claude',
  system: 'Sistema'
}

interface ChatMessageItemProps {
  readonly message: ChatMessage
  /** Cuando el mensaje es del agente, ofrece "Transferir" al Terminal. */
  readonly transfer?: boolean
}

export function ChatMessageItem({ message, transfer }: ChatMessageItemProps): React.JSX.Element {
  const canTransfer = transfer && message.role === 'assistant' && !message.pending

  return (
    <article
      className={`animate-[slideUp_0.25s_ease-out] rounded-lg border px-4 py-3 ${ROLE_CLASS[message.role]}`}
    >
      <MessageChips message={message} />

      <p className="mb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {ROLE_LABEL[message.role]}
      </p>
      <p className="text-sm whitespace-pre-wrap text-foreground">
        {message.content}
        {/* Cursor de streaming dibujado con CSS: no depende de ninguna fuente. */}
        {message.pending ? (
          <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-primary align-text-bottom" />
        ) : null}
      </p>
      {canTransfer ? (
        <div className="mt-2 flex justify-end">
          <TransferBadge text={message.content} />
        </div>
      ) : null}
    </article>
  )
}
