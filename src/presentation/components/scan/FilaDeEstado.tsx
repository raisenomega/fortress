import { ESTADOS_DEL_TABLERO } from '@domain/project/estado-del-tablero'
// prettier-ignore
import { TODAS, type FiltroDeEstado } from '@domain/project/filtro-del-tablero'
import type { EstadoCounts } from '@domain/project/recuento-del-tablero'
import { ChipDeFiltro } from './ChipDeFiltro'
import { NOMBRE_DEL_ESTADO } from './nombre-del-estado'

interface FilaDeEstadoProps {
  readonly activo: FiltroDeEstado
  readonly cuentas: EstadoCounts
  readonly total: number
  readonly onElegir: (valor: FiltroDeEstado) => void
}

/** El eje de EN QUE PUNTO ESTA. «Mitigados» es el que lleva a lo verificable.
 *
 *  Grupo propio por lo mismo que su hermano: compartir linea no puede costar la
 *  distincion entre los dos ejes, que es justo lo que hace util el cruce. */
export function FilaDeEstado(props: FilaDeEstadoProps): React.JSX.Element {
  const { activo, cuentas, total, onElegir } = props

  return (
    <div
      role="group"
      aria-label="Filtrar por estado"
      className="flex flex-wrap items-center gap-1.5"
    >
      <ChipDeFiltro
        activo={activo === TODAS}
        cuenta={total}
        titulo="Todos los estados"
        onClick={() => onElegir(TODAS)}
      >
        <span className="font-semibold tracking-wide uppercase">Todos</span>
      </ChipDeFiltro>
      {ESTADOS_DEL_TABLERO.map((estado) => (
        <ChipDeFiltro
          key={estado}
          activo={activo === estado}
          cuenta={cuentas[estado]}
          titulo={NOMBRE_DEL_ESTADO[estado].ayuda}
          onClick={() => onElegir(estado)}
        >
          {NOMBRE_DEL_ESTADO[estado].texto}
        </ChipDeFiltro>
      ))}
    </div>
  )
}
