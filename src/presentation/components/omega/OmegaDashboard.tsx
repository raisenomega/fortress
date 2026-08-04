import type { Project } from '@domain/project/project'
import { fetchSnippet } from '../../services/omega-service'
import { useOmega, useOmegaStore } from '../../stores/omega-store'
import { useProjectStore } from '../../stores/project-store'
import { OmegaAgentBadges } from './OmegaAgentBadges'
import { OmegaAgentPage } from './OmegaAgentPage'
import { OmegaCompare } from './OmegaCompare'
import { OmegaHeader } from './OmegaHeader'
import { OmegaLogList } from './OmegaLogList'
import { OmegaScorePanel } from './OmegaScorePanel'
import { OmegaSection } from './OmegaSection'
import { OmegaStats } from './OmegaStats'

interface OmegaDashboardProps {
  readonly project: Project
}

/** Composicion del superdashboard. Al elegir un agente, su pagina toma la vista. */
export function OmegaDashboard({ project }: OmegaDashboardProps): React.JSX.Element {
  const id = project.id
  const data = useOmega(id)
  const auditing = useOmegaStore((state) => state.auditing)
  const selected = useOmegaStore((state) => state.selectedAgent)
  const selectAgent = useOmegaStore((state) => state.selectAgent)
  const projects = useProjectStore((state) => state.projects)

  const agent = data.agents.find((a) => a.agentId === selected)
  if (agent) {
    return (
      <OmegaAgentPage
        agent={agent}
        agents={data.agents}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        projectId={id}
        busy={auditing === id}
        log={data.log}
        loadSnippet={(file, line) => fetchSnippet(id, file, line)}
        onBack={() => selectAgent(null)}
      />
    )
  }

  const activos = data.agents.filter((a) => a.runs > 0).length

  return (
    <div className="h-full space-y-5 overflow-y-auto px-4 py-4">
      <OmegaHeader projectId={id} log={data.log} busy={auditing === id} />
      <OmegaSection title="Puntuacion de integridad">
        <OmegaScorePanel score={data.score} />
      </OmegaSection>
      <OmegaSection title={`Agentes del sistema (${activos}/${data.agents.length} con actividad)`}>
        <OmegaAgentBadges agents={data.agents} onSelect={selectAgent} />
      </OmegaSection>
      <OmegaSection title="Estadisticas globales">
        <OmegaStats agents={data.agents} />
      </OmegaSection>
      <OmegaSection title="Comparativa de agentes">
        <OmegaCompare agents={data.agents} />
      </OmegaSection>
      <OmegaSection title="Libro de la Vida — reportado vs verificado">
        <OmegaLogList entries={data.log} loadSnippet={(file, line) => fetchSnippet(id, file, line)} />
      </OmegaSection>
    </div>
  )
}
