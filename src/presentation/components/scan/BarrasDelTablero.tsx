import type { LoteDelTablero } from '../../hooks/useLoteDelTablero'
import type { SeleccionDelTablero } from '../../hooks/useSeleccionDelTablero'
import type { Tablero } from '../../hooks/useTablero'
import { BarraDelLote } from './BarraDelLote'
import { BarraDeSeleccion } from './BarraDeSeleccion'
import { ConfirmVerificarTodos } from './ConfirmVerificarTodos'

interface BarrasDelTableroProps {
  readonly tablero: Tablero
  readonly seleccion: SeleccionDelTablero
  readonly lote: LoteDelTablero
}

/**
 * Las barras de accion del tablero, dentro del bloque fijo. La confirmacion de
 * «Verificar mitigados» va con ellas a proposito: si viviera en la zona que
 * scrollea, al pulsar el boton estando abajo la pregunta saldria fuera de vista.
 */
export function BarrasDelTablero(props: BarrasDelTableroProps): React.JSX.Element {
  const { tablero, seleccion, lote } = props
  const verLote = lote.enLaTabla !== null && (lote.elegidos > 0 || lote.enCurso !== null)

  return (
    <>
      {tablero.seleccion.size > 0 ? (
        <BarraDeSeleccion
          seleccionados={tablero.seleccion.size}
          visiblesSeleccionados={tablero.visiblesSeleccionados}
          verificando={seleccion.verificando}
          onVerificar={seleccion.preguntar}
          onLimpiar={seleccion.limpiar}
        />
      ) : null}

      <BarraDelLote visible={verLote} lote={lote} />

      {seleccion.preguntando ? (
        <ConfirmVerificarTodos
          mitigados={tablero.seleccion.size}
          alcance="seleccionados"
          onCancel={seleccion.cerrar}
          onConfirm={seleccion.confirmar}
        />
      ) : null}
    </>
  )
}
