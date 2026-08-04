import type { Project } from '@domain/project/project'
import { fetchSnippet } from '../../services/omega-service'
import { useOmega, useOmegaStore } from '../../stores/omega-store'
import { OmegaAgentProfile } from './OmegaAgentProfile'
import { OmegaAgentsTable } from './OmegaAgentsTable'
import { OmegaCompare } from './OmegaCompare'
import { OmegaHeader } from './OmegaHeader'
import { OmegaLogList } from './OmegaLogList'
import { OmegaScorePanel } from './OmegaScorePanel'
import { OmegaSection } from './OmegaSection'
import { OmegaStats } from './OmegaStats'

interface OmegaDashboardProps {
  readonly project: Project
}

/** Composicion del superdashboard. Cada seccion pinta datos reales del proyecto. */
export function OmegaDashboard({ project }: OmegaDashboardProps): React.JSX.Element {
  const id = project.id
  const data = useOmega(id)
  const auditing = useOmegaStore((state) => state.auditing)
  const selected = useOmegaStore((state) => state.selectedAgent)
  const selectAgent = useOmegaStore((state) => state.selectAgent)

  return (
    <div className="h-full space-y-5 overflow-y-auto px-4 py-4">
      <OmegaHeader projectId={id} log={data.log} busy={auditing === id} />

      <OmegaSection title="Puntuacion de integridad">
        <OmegaScorePanel score={data.score} />
      </OmegaSection>

      <OmegaSection title="Agentes del sistema — salud real">
        <OmegaAgentsTable agents={data.agents} selected={selected} onSelect={selectAgent} />
      </OmegaSection>

      {selected ? (
        <OmegaSection title={`Perfil — ${selected}`}>
          <OmegaAgentProfile
            projectId={id}
            projectName={project.name}
            agentId={selected}
            busy={auditing === id}
            agents={data.agents}
            runs={data.runs}
            log={data.log}
            loadSnippet={(file, line) => fetchSnippet(id, file, line)}
          />
        </OmegaSection>
      ) : null}

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
