import { useEffect } from 'react'
import { loadCapabilities, loadObservations } from '../../services/self-improvement-service'
import { useCapabilities, useSelfObservations } from '../../stores/self-improvement-store'
import { CapabilitiesSection } from './CapabilitiesSection'
import { ObservationsSection } from './ObservationsSection'
import { ProposeCapability } from './ProposeCapability'

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

  const vacio = observations.length === 0 && capabilities.length === 0

  return (
    <div className="h-full space-y-6 overflow-y-auto px-4 py-4">
      <header>
        <h2 className="text-base text-foreground">Auto-mejora de FORTRESS</h2>
        <p className="text-xs text-muted-foreground">
          Lo que FORTRESS descubre y se crea a si misma trabajando en otros proyectos.
        </p>
      </header>
      <ProposeCapability />
      {vacio ? (
        <p className="text-xs text-muted-foreground">
          Aun no hay capacidades ni pendientes. Propon una arriba, o apareceran cuando un agente
          tope con un limite de FORTRESS en otro proyecto.
        </p>
      ) : null}
      <CapabilitiesSection capabilities={capabilities} />
      <ObservationsSection observations={observations} />
    </div>
  )
}
