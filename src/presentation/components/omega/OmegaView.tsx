import { fetchSnippet, runAudit } from '../../services/omega-service'
import { useOmega, useOmegaStore } from '../../stores/omega-store'
import { useActiveProject } from '../../stores/project-store'
import { EmptyState } from '../common/EmptyState'
import { OmegaAgentProfile } from './OmegaAgentProfile'
import { OmegaAgentsTable } from './OmegaAgentsTable'
import { OmegaHeader } from './OmegaHeader'
import { OmegaLogList } from './OmegaLogList'
import { OmegaScorePanel } from './OmegaScorePanel'
import { OmegaSection } from './OmegaSection'

/**
 * Superdashboard de SENTINEL OMEGA. Todo con datos reales y verificable:
 * metricas del Libro de la Vida, puntuacion honesta, salud macro de los agentes,
 * perfil micro de ejecuciones y las verificaciones con su evidencia en el disco.
 */
export function OmegaView(): React.JSX.Element {
  const project = useActiveProject()
  const data = useOmega(project?.id ?? null)
  const auditing = useOmegaStore((state) => state.auditing)
  const selectedAgent = useOmegaStore((state) => state.selectedAgent)
  const selectAgent = useOmegaStore((state) => state.selectAgent)

  if (!project) {
    return <EmptyState iconName="eye" title="Ningun proyecto" hint="Elige un proyecto para auditar." />
  }

  const id = project.id

  return (
    <div className="h-full space-y-5 overflow-y-auto px-4 py-4">
      <OmegaHeader log={data.log} busy={auditing === id} onAudit={() => void runAudit(id)} />

      <OmegaSection title="Puntuacion de integridad">
        <OmegaScorePanel score={data.score} />
      </OmegaSection>

      <OmegaSection title="Agentes del sistema — salud real">
        <OmegaAgentsTable agents={data.agents} selected={selectedAgent} onSelect={selectAgent} />
      </OmegaSection>

      {selectedAgent ? (
        <OmegaSection title={`Perfil — ${selectedAgent}`}>
          <OmegaAgentProfile agentId={selectedAgent} runs={data.runs} />
        </OmegaSection>
      ) : null}

      <OmegaSection title="Libro de la Vida — reportado vs verificado">
        <OmegaLogList
          entries={data.log}
          loadSnippet={(file, line) => fetchSnippet(id, file, line)}
        />
      </OmegaSection>
    </div>
  )
}
