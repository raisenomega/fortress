interface ChatErrorBannerProps {
  readonly message: string
  readonly onDismiss: () => void
}

export function ChatErrorBanner({ message, onDismiss }: ChatErrorBannerProps): React.JSX.Element {
  return (
    <div
      role="alert"
      className="flex shrink-0 items-start gap-2 border-b border-critical/30 bg-critical/10 px-4 py-2"
    >
      <span aria-hidden>⚠️</span>
      <p className="flex-1 text-xs text-foreground">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Descartar el error"
        className="tap text-xs text-muted-foreground hover:text-foreground"
      >
        ✕
      </button>
    </div>
  )
}
