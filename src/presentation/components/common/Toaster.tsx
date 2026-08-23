import { useToastStore } from '../../stores/toast-store'
import { Icon } from './Icon'
import { Notice } from './Notice'

/** Pila de avisos de fondo, abajo a la derecha; cada uno se cierra con la X. */
export function Toaster(): React.JSX.Element | null {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)
  if (toasts.length === 0) return null

  return (
    <div className="fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="relative">
          <Notice tone={toast.tone}>
            {toast.count > 1 ? `${toast.message} (×${toast.count})` : toast.message}
          </Notice>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => dismiss(toast.id)}
            className="tap absolute top-1 right-1 text-muted-foreground"
          >
            <Icon name="x-circle" size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}
