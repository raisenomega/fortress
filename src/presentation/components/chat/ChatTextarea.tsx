interface ChatTextareaProps {
  readonly value: string
  readonly disabled: boolean
  readonly placeholder: string
  /** Clases de la caja segun variante (chat con borde, terminal monospace). */
  readonly boxClass: string
  readonly onChange: (value: string) => void
  readonly onEnter: () => void
}

const BASE =
  'max-h-40 min-h-[2.5rem] flex-1 resize-y rounded-md border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50'

/** El textarea del chat/terminal: Enter envia, Shift+Enter hace salto de linea. */
export function ChatTextarea({
  value,
  disabled,
  placeholder,
  boxClass,
  onChange,
  onEnter
}: ChatTextareaProps): React.JSX.Element {
  return (
    <textarea
      rows={1}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' || event.shiftKey) return
        event.preventDefault()
        onEnter()
      }}
      className={`${BASE} ${boxClass}`}
    />
  )
}
