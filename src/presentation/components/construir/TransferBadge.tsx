import { Icon } from '../common/Icon'
import { useUiStore } from '../../stores/ui-store'
import { useWorkflowStore } from '../../stores/workflow-store'

interface TransferBadgeProps {
  readonly text: string
}

/**
 * Badge dentro de una respuesta del Chat: "Transferir" precarga esa conclusion
 * o instruccion en el input del Terminal (ejecucion) y salta alli, sin tener
 * que reescribirla. Mismo puente que AskChatButton (workflow-store.draft).
 */
export function TransferBadge({ text }: TransferBadgeProps): React.JSX.Element {
  const setView = useUiStore((state) => state.setView)
  const setDraft = useWorkflowStore((state) => state.setDraft)

  function transfer(): void {
    setDraft(text)
    setView('chat')
  }

  return (
    <button
      type="button"
      onClick={transfer}
      title="Transferir esta respuesta al Terminal"
      className="tap inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20"
    >
      <Icon name="send" size={11} />
      Transferir
    </button>
  )
}
