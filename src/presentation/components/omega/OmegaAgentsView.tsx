import type { AgentHealth } from '@domain/omega/agent-health'
import type { OmegaScore } from '@domain/omega/omega-score'
import { OmegaAgentBadges } from './OmegaAgentBadges'
import { OmegaCompare } from './OmegaCompare'
import { OmegaScorePanel } from './OmegaScorePanel'
import { OmegaSection } from './OmegaSection'
import { OmegaStats } from './OmegaStats'

interface OmegaAgentsViewProps {
  readonly agents: readonly AgentHealth[]
  readonly score: OmegaScore | null
  readonly onSelect: (agentId: string) => void
}

/** Scope de AGENTES: puntuacion, badges (click abre su pagina), estadisticas, comparativa. */
export function OmegaAgentsView({
  agents,
  score,
  onSelect
}: OmegaAgentsViewProps): React.JSX.Element {
  const activos = agents.filter((a) => a.runs > 0).length

  return (
    <>
      <OmegaSection title="Puntuacion de integridad">
        <OmegaScorePanel score={score} />
      </OmegaSection>
      <OmegaSection title={`Agentes del sistema (${activos}/${agents.length} con actividad)`}>
        <OmegaAgentBadges agents={agents} onSelect={onSelect} />
      </OmegaSection>
      <OmegaSection title="Estadisticas globales">
        <OmegaStats agents={agents} />
      </OmegaSection>
      <OmegaSection title="Comparativa de agentes">
        <OmegaCompare agents={agents} />
      </OmegaSection>
    </>
  )
}
