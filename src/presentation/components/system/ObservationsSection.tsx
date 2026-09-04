import type { SelfObservation } from '@domain/system/self-observation'
import { usePaginado } from '../../hooks/usePaginado'
import { ObservationCard } from './ObservationCard'
import { recuento } from './observation-recuento'
import { TONO_ESTADO } from './observation-tones'
import { Paginador } from './Paginador'

interface ObservationsSectionProps {
  readonly observations: readonly SelfObservation[]
}

/**
 * El backlog entero, en orden de observacion y de diez en diez. Pintaba las
 * trescientas cuarenta de golpe en una rejilla, y ademas solo las abiertas: no
 * se podia ver que algo se hubiera atendido nunca.
 *
 * NO agrupa por tema. Agrupar exige que `area` sea un vocabulario cerrado y hoy
 * es prosa libre —ciento cincuenta y cuatro valores para doscientas veintidos
 * filas—, asi que un contador por tema mentiria. La agrupacion se pone encima
 * de esto cuando el vocabulario exista, sin rehacerlo.
 */
export function ObservationsSection({
  observations
}: ObservationsSectionProps): React.JSX.Element | null {
  const { visibles, pagina, irA } = usePaginado(observations)
  if (observations.length === 0) return null

  return (
    <section className="space-y-2">
      <h2 className="text-base text-foreground">Backlog de auto-mejora</h2>
      <p className="flex flex-wrap gap-x-3 text-xs">
        {recuento(observations).map(({ status, n }) => (
          <span key={status} className={TONO_ESTADO[status]}>
            {n} {status}
          </span>
        ))}
      </p>
      <div className="space-y-1">
        {visibles.map((observation) => (
          <ObservationCard key={observation.id} observation={observation} />
        ))}
      </div>
      <Paginador pagina={pagina} onPagina={irA} />
    </section>
  )
}
