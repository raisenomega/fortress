interface ModalProps {
  readonly title: string
  readonly onClose: () => void
  readonly children: React.ReactNode
}

export function Modal({ title, onClose, children }: ModalProps): React.JSX.Element {
  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-6 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg animate-[slideUp_0.25s_ease-out] rounded-lg border border-border bg-card p-5 shadow-xl"
      >
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-base text-card-foreground">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="tap rounded px-2 text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}
