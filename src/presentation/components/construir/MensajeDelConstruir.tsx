import type { ConstruirMsg } from '../../stores/construir-store'
import { TransferBadge } from '../chat/TransferBadge'
import { Markdown } from '../docs/Markdown'

const TONO: Record<'user' | 'assistant', string> = {
  user: 'text-foreground',
  assistant: 'text-muted-foreground'
}

/** Una linea del hilo de construir: prompt dorado para el operador; la
 *  respuesta del agente en markdown (el texto YA viene tachado, PASO 94). */
export function MensajeDelConstruir({ msg }: { readonly msg: ConstruirMsg }): React.JSX.Element {
  return (
    <div className="flex gap-2">
      <span className="w-3 shrink-0 text-right text-primary select-none">
        {msg.role === 'user' ? '❯' : ''}
      </span>
      <div className={`min-w-0 flex-1 break-words ${TONO[msg.role]}`}>
        {msg.role === 'assistant' ? (
          <Markdown text={msg.text} className="space-y-1" />
        ) : (
          <span className="whitespace-pre-wrap">{msg.text}</span>
        )}
        {msg.role === 'assistant' ? (
          <div className="mt-2 flex justify-end">
            <TransferBadge text={msg.text} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
