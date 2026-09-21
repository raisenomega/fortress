import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useCerrarConEscape } from '../../hooks/useCerrarConEscape'
import { useFocoDelDialogo } from '../../hooks/useFocoDelDialogo'

interface ModalProps {
  readonly title: string
  readonly onClose: () => void
  readonly children: React.ReactNode
}

/**
 * Se monta en `document.body` por PORTAL y no donde se declara. `position:
 * fixed` basta mientras el modal cuelgue de un div normal, pero el primero que
 * nacio dentro de una `<table>` —el de mitigar, en su celda— salio con el texto
 * desbordado fuera de la caja: la maquetacion de tabla alcanza al hijo aunque
 * este fijado. El portal lo saca de ahi, y de cualquier otro contenedor
 * incomodo que venga despues. Mismo motivo que `BreakdownPopover`.
 */
export function Modal({ title, onClose, children }: ModalProps): React.JSX.Element {
  const caja = useRef<HTMLDivElement | null>(null)
  useCerrarConEscape(onClose)
  useFocoDelDialogo(caja)

  return createPortal(
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-6 backdrop-blur-sm"
    >
      <div
        ref={caja}
        tabIndex={-1}
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
            className="tap rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X size={15} aria-hidden />
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body
  )
}
