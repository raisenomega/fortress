import { useEffect } from 'react'
import { loadObservations, resolveObservation } from '../../services/self-improvement-service'
import { useSelfObservations } from '../../stores/self-improvement-store'
import { EmptyState } from '../common/EmptyState'
import { ObservationCard } from './ObservationCard'

/**
 * Pendientes de FORTRESS: lo que los agentes descubren de FORTRESS mismo
 * mientras trabajan en OTROS proyectos. Cada trabajo hace madurar al sistema.
 */
export function SelfImprovementView(): React.JSX.Element {
  const observations = useSelfObservations()

  useEffect(() => {
    void loadObservations()
  }, [])

  if (observations.length === 0) {
    return (
      <EmptyState
        iconName="sparkles"
        title="Sin pendientes de FORTRESS"
        hint="Cuando un agente topa con un limite de FORTRESS en otro proyecto, lo anota aqui."
      />
    )
  }

  return (
    <div className="h-full space-y-4 overflow-y-auto px-4 py-4">
      <header>
        <h2 className="text-base text-foreground">Auto-mejora de FORTRESS</h2>
        <p className="text-xs text-muted-foreground">
          {observations.length} pendientes que los agentes descubrieron trabajando.
        </p>
      </header>

      <div className="grid gap-2 lg:grid-cols-2">
        {observations.map((observation) => (
          <ObservationCard
            key={observation.id}
            observation={observation}
            onResolve={(id) => void resolveObservation(id)}
          />
        ))}
      </div>
    </div>
  )
}
