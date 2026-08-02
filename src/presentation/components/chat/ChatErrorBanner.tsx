import { X } from 'lucide-react'
import { Icon } from '../common/Icon'

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
      <Icon name="alert-triangle" size={13} className="mt-0.5 shrink-0 text-critical" />
      <p className="flex-1 text-xs text-foreground">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Descartar el error"
        className="tap text-muted-foreground hover:text-foreground"
      >
        <X size={13} aria-hidden />
      </button>
    </div>
  )
}
