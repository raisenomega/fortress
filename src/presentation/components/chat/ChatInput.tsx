import { useWorkflowStore } from '../../stores/workflow-store'
import { QuickActions } from './QuickActions'
import { SendButton } from './SendButton'

interface ChatInputProps {
  readonly disabled: boolean
  readonly onSend: (text: string) => void
  /** Mientras corre, el mismo boton pasa a detener. */
  readonly running: boolean
  readonly onStop: () => void
}

/**
 * El borrador vive en el store y no en estado local. Asi otra pantalla puede
 * precargarlo (el escaneo manda su pregunta ya escrita) sin copiarlo con un
 * efecto, que encadenaba renders y ademas duplicaba la fuente de verdad.
 */
export function ChatInput({
  disabled,
  onSend,
  running,
  onStop
}: ChatInputProps): React.JSX.Element {
  const draft = useWorkflowStore((state) => state.draft)
  const setDraft = useWorkflowStore((state) => state.setDraft)

  function submit(): void {
    const trimmed = draft.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setDraft('')
  }

  return (
    <div className="shrink-0 space-y-2 border-t border-border bg-sidebar px-4 py-3">
      <QuickActions disabled={disabled} onPick={onSend} />

      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <textarea
          rows={1}
          value={draft}
          disabled={disabled}
          placeholder="Pide una revision, una limpieza, un plan..."
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey) return
            event.preventDefault()
            submit()
          }}
          className="max-h-40 min-h-[2.5rem] flex-1 resize-y rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50"
        />
        <SendButton running={running} onStop={onStop} disabled={draft.trim().length === 0} />
      </form>
    </div>
  )
}
