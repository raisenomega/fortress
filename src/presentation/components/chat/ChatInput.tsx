import { useWorkflowStore } from '../../stores/workflow-store'
import { ChatTextarea } from './ChatTextarea'
import { QuickActions } from './QuickActions'
import { SendButton } from './SendButton'

interface ChatInputProps {
  readonly disabled: boolean
  readonly onSend: (text: string) => void
  /** Mientras corre, el mismo boton pasa a detener. */
  readonly running: boolean
  readonly onStop: () => void
  /** En configuracion no hay atajos: solo se responde a la entrevista. */
  readonly configuring: boolean
  /** Terminal: input monospace con prompt, sobre fondo de consola. */
  readonly terminal?: boolean
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
  onStop,
  configuring,
  terminal
}: ChatInputProps): React.JSX.Element {
  const draft = useWorkflowStore((state) => state.draft)
  const setDraft = useWorkflowStore((state) => state.setDraft)

  const placeholder = configuring ? 'Responde para configurar...' : 'Pide una revision o un plan...'
  const box = terminal ? 'border-transparent bg-transparent font-mono' : 'border-border bg-input'

  function submit(): void {
    const trimmed = draft.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setDraft('')
  }

  return (
    <div
      className={`shrink-0 space-y-2 border-t border-border px-4 py-3 ${terminal ? 'bg-background' : 'bg-sidebar'}`}
    >
      {configuring ? null : <QuickActions disabled={disabled} onPick={onSend} />}

      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        {terminal ? <span className="pb-2 font-mono text-primary select-none">❯</span> : null}
        <ChatTextarea
          value={draft}
          disabled={disabled}
          placeholder={placeholder}
          boxClass={box}
          onChange={setDraft}
          onEnter={submit}
        />
        <SendButton running={running} onStop={onStop} disabled={draft.trim().length === 0} />
      </form>
    </div>
  )
}
