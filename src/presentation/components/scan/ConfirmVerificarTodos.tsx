import { avisosDeLaVerificacion } from './acto-de-verificar'
import { Modal } from '../common/Modal'

interface ConfirmVerificarTodosProps {
  readonly mitigados: number
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

/**
 * Verificar los mitigados cuesta horas y dinero, y este gesto NO lleva techo de
 * gasto por decision (sigue la doctrina del escaneo). Por eso la confirmacion no
 * es opcional: con un tope detras, un clic de mas se paga caro pero acotado; sin
 * el, esta pantalla es lo unico que hay entre el clic y la factura.
 */
export function ConfirmVerificarTodos(props: ConfirmVerificarTodosProps): React.JSX.Element {
  const { mitigados, onCancel, onConfirm } = props
  const avisos = avisosDeLaVerificacion(mitigados)

  return (
    <Modal title="Verificar todos los mitigados" onClose={onCancel}>
      <div className="space-y-3">
        <p className="text-foreground text-sm">{avisos.trabajo}</p>
        <p className="text-medium text-xs">{avisos.coste}</p>
        <p className="text-success/80 text-xs">{avisos.garantia}</p>
        <p className="text-muted-foreground text-xs">{avisos.parada}</p>

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
            Verificar {mitigados}
          </button>
        </div>
      </div>
    </Modal>
  )
}
