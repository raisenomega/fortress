import { useConstruirStore } from '../../stores/construir-store'
import { TransferBadge } from '../chat/TransferBadge'

const USER = 'ml-auto max-w-[85%] rounded-lg bg-primary/10 px-3 py-2 text-sm text-foreground'
const BOT =
  'mr-auto max-w-[95%] rounded-lg border border-border px-3 py-2 text-sm whitespace-pre-wrap text-foreground'

/** Historial de la conversacion de construir (en memoria, esta sesion). */
export function ConstruirMessages(): React.JSX.Element {
  const messages = useConstruirStore((s) => s.messages)
  const busy = useConstruirStore((s) => s.busy)

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-1 py-3">
      {messages.length === 0 && !busy ? (
        <p className="pt-10 text-center text-xs text-muted-foreground">
          Describe lo que quieres. Elige el modo con la flecha.
        </p>
      ) : null}
      {messages.map((msg, i) =>
        msg.role === 'user' ? (
          <div key={i} className={USER}>
            {msg.text}
          </div>
        ) : (
          <div key={i} className={BOT}>
            {msg.text}
            <div className="mt-2 flex justify-end">
              <TransferBadge text={msg.text} />
            </div>
          </div>
        )
      )}
      {busy ? <p className="text-xs text-muted-foreground">Trabajando...</p> : null}
    </div>
  )
}
