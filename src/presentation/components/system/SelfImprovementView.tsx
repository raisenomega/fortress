import { useEffect } from 'react'
import { loadCapabilities, loadObservations } from '../../services/self-improvement-service'
import { useCapabilities, useSelfObservations } from '../../stores/self-improvement-store'
import { EmptyState } from '../common/EmptyState'
import { CapabilitiesSection } from './CapabilitiesSection'
import { ObservationsSection } from './ObservationsSection'

/**
 * Auto-mejora de FORTRESS: lo que los agentes descubren de FORTRESS mismo en
 * OTROS proyectos (backlog) y las capacidades que de ahi nacen y ascienden por
 * episodios reales. Cada trabajo hace madurar al sistema.
 */
export function SelfImprovementView(): React.JSX.Element {
  const observations = useSelfObservations()
  const capabilities = useCapabilities()

  useEffect(() => {
    void loadObservations()
    void loadCapabilities()
  }, [])

  if (observations.length === 0 && capabilities.length === 0) {
    return (
      <EmptyState
        iconName="sparkles"
        title="Sin pendientes de FORTRESS"
        hint="Cuando un agente topa con un limite de FORTRESS en otro proyecto, lo anota aqui."
      />
    )
  }

  return (
    <div className="h-full space-y-6 overflow-y-auto px-4 py-4">
      <CapabilitiesSection capabilities={capabilities} />
      <ObservationsSection observations={observations} />
    </div>
  )
}
