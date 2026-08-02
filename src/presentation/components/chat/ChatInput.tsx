import { useState } from 'react'
import { QuickActions } from './QuickActions'

interface ChatInputProps {
  readonly disabled: boolean
  readonly onSend: (text: string) => void
}

export function ChatInput({ disabled, onSend }: ChatInputProps): React.JSX.Element {
  const [draft, setDraft] = useState('')

  function submit(text: string): void {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setDraft('')
  }

  return (
    <div className="shrink-0 space-y-2 border-t border-border bg-sidebar px-4 py-3">
      <QuickActions disabled={disabled} onPick={submit} />

      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          submit(draft)
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
            submit(draft)
          }}
          className="max-h-40 min-h-[2.5rem] flex-1 resize-y rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || draft.trim().length === 0}
          className="tap h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}
