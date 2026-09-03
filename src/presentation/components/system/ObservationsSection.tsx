import type { SelfObservation } from '@domain/system/self-observation'
import { ObservationCard } from './ObservationCard'

interface ObservationsSectionProps {
  readonly observations: readonly SelfObservation[]
}

export function ObservationsSection({
  observations
}: ObservationsSectionProps): React.JSX.Element | null {
  if (observations.length === 0) return null
  return (
    <section>
      <h2 className="text-base text-foreground">Pendientes de auto-mejora</h2>
      <p className="text-xs text-muted-foreground">
        {observations.length} cosas que los agentes descubrieron de FORTRESS trabajando.
      </p>
      <div className="mt-2 grid gap-2 lg:grid-cols-2">
        {observations.map((observation) => (
          <ObservationCard key={observation.id} observation={observation} />
        ))}
      </div>
    </section>
  )
}
