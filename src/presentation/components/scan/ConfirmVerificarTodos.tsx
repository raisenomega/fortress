import { avisosDeLaVerificacion } from './acto-de-verificar'
import { TITULO, type AlcanceDeLaVerificacion } from './alcance-de-la-verificacion'
import { Modal } from '../common/Modal'

interface ConfirmVerificarTodosProps {
  readonly mitigados: number
  /** Cual de las dos puertas pregunta. Cambia el titulo y a que se refiere la
   *  cifra; el trato —cuanto cuesta, que nada muere sin prueba— es el mismo. */
  readonly alcance: AlcanceDeLaVerificacion
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

/**
 * Verificar cuesta horas y dinero, y este gesto NO lleva techo de gasto por
 * decision (sigue la doctrina del escaneo). Por eso la confirmacion no es
 * opcional: con un tope detras, un clic de mas se paga caro pero acotado; sin
 * el, esta pantalla es lo unico que hay entre el clic y la factura.
 *
 * La usan LAS DOS puertas —el boton de la cabecera y la barra de seleccion—
 * porque las dos gastan igual. Una que no preguntara seria la unica sin barrera,
 * y seria la de un clic sobre una fila.
 */
export function ConfirmVerificarTodos(props: ConfirmVerificarTodosProps): React.JSX.Element {
  const { mitigados, alcance, onCancel, onConfirm } = props
  const avisos = avisosDeLaVerificacion(mitigados, alcance)

  return (
    <Modal title={`${TITULO[alcance]} (${mitigados})`} onClose={onCancel}>
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
