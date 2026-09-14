// prettier-ignore
import type { FiltroDeEstado, FiltroDeSeveridad, FiltroDelTablero } from '@domain/project/filtro-del-tablero'
import type { RecuentoDelTablero } from '@domain/project/recuento-del-tablero'
import { FilaDeEstado } from './FilaDeEstado'
import { FilaDeSeveridad } from './FilaDeSeveridad'

interface ChipsDelTableroProps {
  readonly filtro: FiltroDelTablero
  readonly recuento: RecuentoDelTablero
  readonly onSeveridad: (valor: FiltroDeSeveridad) => void
  readonly onEstado: (valor: FiltroDeEstado) => void
}

/**
 * Los DOS ejes del tablero, en dos filas. Son ortogonales y se cruzan: el
 * dominio ya dice que `status` y `lifecycle` lo son —«un hallazgo puede estar
 * descartado y ACTIVE»— y filtrar por uno solo no lleva a ningun sitio util.
 * «Mitigados» + «HIGH» son las HIGH que se pueden verificar, y ese cruce es el
 * motivo de que haya dos filas y no una.
 *
 * Las cuentas salen del ARRAY que la tabla pinta, no de `countsByProject`: si el
 * chip dijera 8 y al pulsarlo salieran 10 filas, el numero dejaria de ser la
 * promesa de lo que vas a ver, y un chip que no promete no sirve para navegar.
 */
export function ChipsDelTablero(props: ChipsDelTableroProps): React.JSX.Element {
  const { filtro, recuento, onSeveridad, onEstado } = props

  return (
    <div className="space-y-1.5">
      <FilaDeSeveridad
        activo={filtro.severidad}
        cuentas={recuento.porSeveridad}
        total={recuento.totalSeveridad}
        onElegir={onSeveridad}
      />
      <FilaDeEstado
        activo={filtro.estado}
        cuentas={recuento.porEstado}
        total={recuento.totalEstado}
        onElegir={onEstado}
      />
    </div>
  )
}
