import { avisosDelDrenaje, type TopesDelDrenaje } from './acto-de-drenar'
import { Modal } from '../common/Modal'

interface ConfirmDrenajeProps extends TopesDelDrenaje {
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

/**
 * Drenar cuesta dinero y minutos —cada hallazgo son cuatro agentes y del orden
 * de un millon y medio de tokens—, y arrancaba con un solo clic sin decir nada.
 * No es un modo que se enciende: es un gasto que se autoriza sabiendo cuanto.
 *
 * Los numeros son los REALES: los elegibles salen del mismo calculo que usa la
 * seleccion y los topes se leen de los ajustes al abrir, no son una estimacion.
 */
export function ConfirmDrenaje(props: ConfirmDrenajeProps): React.JSX.Element {
  const { elegibles, costCapUsd, maxVueltas, onCancel, onConfirm } = props
  const avisos = avisosDelDrenaje({ elegibles, costCapUsd, maxVueltas })

  return (
    <Modal title="Drenar los elegibles" onClose={onCancel}>
      <div className="space-y-3">
        <p className="text-foreground text-sm">{avisos.trabajo}</p>
        <p className="text-muted-foreground text-xs">{avisos.topes}</p>
        <p className="text-success/80 text-xs">{avisos.garantia}</p>
        <p className="text-medium text-xs">{avisos.orden}</p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="tap border-border text-muted-foreground hover:text-foreground rounded-md border px-3 py-1.5 text-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="tap bg-primary text-background rounded-md px-3 py-1.5 text-xs font-semibold hover:brightness-110"
          >
            Drenar {elegibles}
          </button>
        </div>
      </div>
    </Modal>
  )
}
