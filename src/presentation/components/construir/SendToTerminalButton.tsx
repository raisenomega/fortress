import { Icon } from '../common/Icon'
import { useUiStore } from '../../stores/ui-store'
import { useWorkflowStore } from '../../stores/workflow-store'

interface SendToTerminalButtonProps {
  readonly text: string
}

/**
 * Lleva una conclusion o instruccion del Chat (planificacion) al Terminal
 * (ejecucion) precargada en su input: solo hay que revisarla y pulsar Enter.
 * Asi lo hablado y decidido aqui pasa a ejecutarse sin volver a escribirlo.
 */
export function SendToTerminalButton({ text }: SendToTerminalButtonProps): React.JSX.Element {
  const setView = useUiStore((state) => state.setView)
  const setDraft = useWorkflowStore((state) => state.setDraft)

  function send(): void {
    setDraft(text)
    setView('chat')
  }

  return (
    <button
      type="button"
      onClick={send}
      title="Precargar esto en el Terminal para ejecutarlo"
      className="tap mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary"
    >
      <Icon name="arrow-up" size={12} />
      Enviar al Terminal
    </button>
  )
}
