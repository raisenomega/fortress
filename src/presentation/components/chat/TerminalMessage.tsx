import type { ChatMessage } from '@domain/chat/chat-message'

/** Prompt por rol: el usuario "escribe" tras el cursor; la salida no lleva prompt. */
const PROMPT: Record<ChatMessage['role'], string> = {
  user: '❯',
  assistant: '',
  system: '#'
}

const TONE: Record<ChatMessage['role'], string> = {
  user: 'text-foreground',
  assistant: 'text-muted-foreground',
  system: 'text-medium'
}

interface TerminalMessageProps {
  readonly message: ChatMessage
}

/** Un mensaje pintado como linea de terminal: prompt dorado + salida monospace. */
export function TerminalMessage({ message }: TerminalMessageProps): React.JSX.Element {
  return (
    <div className="flex gap-2 font-mono text-[13px] leading-relaxed">
      <span className="w-3 shrink-0 text-right text-primary select-none">
        {PROMPT[message.role]}
      </span>
      <p className={`min-w-0 flex-1 break-words whitespace-pre-wrap ${TONE[message.role]}`}>
        {message.content}
        {message.pending ? (
          <span className="ml-0.5 inline-block h-3.5 w-2 animate-pulse bg-primary align-text-bottom" />
        ) : null}
      </p>
    </div>
  )
}
