import { useToastStore } from '../../stores/toast-store'
import { Icon } from './Icon'
import { Notice } from './Notice'

/**
 * Pila de avisos de fondo, abajo a la derecha; cada uno se cierra con la X.
 *
 * La region viva esta SIEMPRE montada, vacia incluida, y por eso no hay
 * `return null`. Un lector de pantalla solo anuncia lo que cambia dentro de una
 * region que YA conocia: si el contenedor naciera a la vez que su primer aviso,
 * ese aviso —justo el que importaba— llegaria mudo. Vacia mide cero de alto: ni
 * tapa ni intercepta nada.
 */
export function Toaster(): React.JSX.Element {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div aria-live="polite" className="fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="relative">
          <Notice tone={toast.tone} callado>
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
