// prettier-ignore
import { TODAS, type FiltroDeSeveridad } from '@domain/project/filtro-del-tablero'
import type { SeverityCounts } from '@domain/project/severity-counts'
import { SEVERITIES } from '@domain/shared/severity'
import { ChipDeFiltro } from './ChipDeFiltro'
import { SeverityBadge } from './SeverityBadge'

interface FilaDeSeveridadProps {
  readonly activo: FiltroDeSeveridad
  readonly cuentas: SeverityCounts
  readonly total: number
  readonly onElegir: (valor: FiltroDeSeveridad) => void
}

/** El eje de CUANTO URGE. Las cuentas llegan ya cruzadas con el otro eje.
 *
 *  Se anuncia como GRUPO porque los dos ejes van en un solo flujo: la raya que
 *  los separa es decorativa (`aria-hidden`), asi que sin esto un lector de
 *  pantalla oiria nueve botones seguidos sin saber que son dos preguntas. */
export function FilaDeSeveridad(props: FilaDeSeveridadProps): React.JSX.Element {
  const { activo, cuentas, total, onElegir } = props

  return (
    <div
      role="group"
      aria-label="Filtrar por severidad"
      className="flex flex-wrap items-center gap-1.5"
    >
      <ChipDeFiltro
        activo={activo === TODAS}
        cuenta={total}
        titulo="Todas las severidades"
        onClick={() => onElegir(TODAS)}
      >
        <span className="font-semibold tracking-wide uppercase">Todas</span>
      </ChipDeFiltro>
      {SEVERITIES.map((severity) => (
        <ChipDeFiltro
          key={severity}
          activo={activo === severity}
          cuenta={cuentas[severity]}
          titulo={`Solo ${severity}`}
          onClick={() => onElegir(severity)}
        >
          <SeverityBadge severity={severity} />
        </ChipDeFiltro>
      ))}
    </div>
  )
}
