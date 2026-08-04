import type { Capability } from '@domain/system/capability'
import { promoteCapability } from '../../services/self-improvement-service'
import { CapabilityCard } from './CapabilityCard'

interface CapabilitiesSectionProps {
  readonly capabilities: readonly Capability[]
}

export function CapabilitiesSection({
  capabilities
}: CapabilitiesSectionProps): React.JSX.Element | null {
  if (capabilities.length === 0) return null
  return (
    <section>
      <h2 className="text-base text-foreground">Capacidades</h2>
      <p className="text-xs text-muted-foreground">
        Nacen de una oportunidad; ascienden por episodios reales, con OMEGA como testigo.
      </p>
      <div className="mt-2 grid gap-2 lg:grid-cols-2">
        {capabilities.map((capability) => (
          <CapabilityCard
            key={capability.id}
            capability={capability}
            onPromote={(id, human) => void promoteCapability(id, human)}
          />
        ))}
      </div>
    </section>
  )
}
