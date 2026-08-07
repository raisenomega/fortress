import { MessageSquare } from 'lucide-react'
import type { Finding } from '@domain/project/project'
import { useUiStore } from '../../stores/ui-store'
import { useWorkflowStore } from '../../stores/workflow-store'

interface AskChatButtonProps {
  readonly projectName: string
  readonly findings: readonly Finding[]
}

/**
 * Lleva los hallazgos al chat con la pregunta ya escrita: solo hay que pulsar
 * Enter. Antes habia que redactarla a mano, y al preguntar "que viste en el
 * escaneo" el agente se ponia a buscar la base de datos por el disco.
 */
export function AskChatButton({
  projectName,
  findings
}: AskChatButtonProps): React.JSX.Element | null {
  const setView = useUiStore((state) => state.setView)
  const setDraft = useWorkflowStore((state) => state.setDraft)

  if (findings.length === 0) return null

  const abiertos = findings.filter((finding) => finding.status === 'open').length

  function open(): void {
    setDraft(
      `Explicame los ${abiertos} hallazgos abiertos del ultimo escaneo de ${projectName} ` +
        'y dime cual arreglarias primero y por que. No hace falta que vuelvas a escanear.'
    )
    setView('chat')
  }

  return (
    <button
      type="button"
      onClick={open}
      title="Abre el Terminal con la pregunta ya escrita"
      className="tap flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
    >
      <MessageSquare size={13} aria-hidden />
      Preguntar al Terminal
    </button>
  )
}
