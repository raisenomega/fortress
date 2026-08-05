import { Icon } from '../common/Icon'
import { useConstruirStore } from '../../stores/construir-store'
import { attachFile } from '../../services/construir-service'
import { ConstruirSend } from './ConstruirSend'

interface ConstruirInputProps {
  readonly projectId: string
}

/** Barra del chat: adjuntar (izq), texto, y la flecha/Detener (der). */
export function ConstruirInput({ projectId }: ConstruirInputProps): React.JSX.Element {
  const input = useConstruirStore((s) => s.input)
  const attached = useConstruirStore((s) => s.attached)
  const setInput = useConstruirStore((s) => s.setInput)

  return (
    <div>
      {attached ? (
        <p className="truncate px-2 pb-1 text-[11px] text-muted-foreground">Adjunto: {attached}</p>
      ) : null}
      <div className="flex items-end gap-2 rounded-lg border border-border bg-background px-2 py-2">
        <button
          type="button"
          onClick={() => void attachFile()}
          title="Adjuntar archivo"
          className="tap text-muted-foreground hover:text-foreground"
        >
          <Icon name="paperclip" size={18} />
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe lo que quieres construir o investigar..."
          className="max-h-32 min-h-[38px] flex-1 resize-none bg-transparent text-sm text-foreground outline-none"
        />
        <ConstruirSend projectId={projectId} />
      </div>
    </div>
  )
}
