import { Plus } from 'lucide-react'
import { AGENT_CATALOG } from '@domain/agent/agent-catalog'
import { useActiveAgentCount } from '../../stores/agent-store'
import { useProjectStore } from '../../stores/project-store'
import { useSidebarStore } from '../../stores/sidebar-store'
import { useUiStore } from '../../stores/ui-store'
import { AgentPanel } from '../agents/AgentPanel'
import { Logo } from '../common/Logo'
import { ProjectList } from '../projects/ProjectList'
import { SidebarNav } from './SidebarNav'
import { SidebarRail } from './SidebarRail'
import { SidebarSection } from './SidebarSection'
import { SidebarToggle } from './SidebarToggle'
import { SidebarViewLinks } from './SidebarViewLinks'

export function Sidebar(): React.JSX.Element {
  const projectCount = useProjectStore((state) => state.projects.length)
  const activeCount = useActiveAgentCount()
  const setAddProjectOpen = useUiStore((state) => state.setAddProjectOpen)
  const collapsed = useSidebarStore((state) => state.collapsed)

  return (
    <aside className="flex h-full flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-1 border-b border-sidebar-border px-2 py-3">
        {collapsed ? null : <Logo className="h-11 min-w-0 flex-1 rounded-md object-left" />}
        <SidebarToggle />
      </div>

      {collapsed ? (
        <SidebarRail />
      ) : (
        <>
          <SidebarSection
            id="proyectos"
            title={`Proyectos (${projectCount})`}
            action={
              <button
                type="button"
                onClick={() => setAddProjectOpen(true)}
                title="Agregar proyecto"
                className="tap rounded p-0.5 text-primary hover:bg-accent/40"
              >
                <Plus size={15} aria-hidden />
              </button>
            }
          >
            <ProjectList />
          </SidebarSection>

          <SidebarSection id="agentes" title={`Agentes (${activeCount}/${AGENT_CATALOG.length})`}>
            <AgentPanel />
          </SidebarSection>

          <SidebarViewLinks />
          <SidebarNav />
        </>
      )}
    </aside>
  )
}
