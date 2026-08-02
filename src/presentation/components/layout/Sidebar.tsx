import { AGENT_CATALOG } from '@domain/agent/agent-catalog'
import { useAgentStore } from '../../stores/agent-store'
import { useProjectStore } from '../../stores/project-store'
import { AgentPanel } from '../agents/AgentPanel'
import { ProjectList } from '../projects/ProjectList'
import { SidebarSection } from './SidebarSection'

interface SidebarProps {
  /** Ausente mientras el selector nativo de carpetas no este conectado (paso 8). */
  readonly onAddProject?: () => void
}

export function Sidebar({ onAddProject }: SidebarProps): React.JSX.Element {
  const projectCount = useProjectStore((state) => state.projects.length)
  const enabledCount = useAgentStore((state) => state.enabled.length)

  return (
    <aside className="flex h-full flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar">
      <SidebarSection
        title={`Proyectos (${projectCount})`}
        action={
          <button
            type="button"
            onClick={onAddProject}
            disabled={!onAddProject}
            title="Agregar proyecto"
            className="tap rounded px-1.5 text-sm text-primary hover:bg-accent/40 disabled:opacity-30"
          >
            +
          </button>
        }
      >
        <ProjectList />
      </SidebarSection>

      <SidebarSection title={`Agentes (${enabledCount}/${AGENT_CATALOG.length})`}>
        <AgentPanel />
      </SidebarSection>
    </aside>
  )
}
