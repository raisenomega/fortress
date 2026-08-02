import { Plus } from 'lucide-react'
import { AGENT_CATALOG } from '@domain/agent/agent-catalog'
import { useAgentStore } from '../../stores/agent-store'
import { useProjectStore } from '../../stores/project-store'
import { useUiStore } from '../../stores/ui-store'
import { AgentPanel } from '../agents/AgentPanel'
import { Logo } from '../common/Logo'
import { ProjectList } from '../projects/ProjectList'
import { SidebarNavButton } from './SidebarNavButton'
import { SidebarSection } from './SidebarSection'

export function Sidebar(): React.JSX.Element {
  const projectCount = useProjectStore((state) => state.projects.length)
  const enabledCount = useAgentStore((state) => state.enabled.length)
  const view = useUiStore((state) => state.view)
  const setView = useUiStore((state) => state.setView)
  const setAddProjectOpen = useUiStore((state) => state.setAddProjectOpen)

  return (
    <aside className="flex h-full flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar">
      <div className="border-b border-sidebar-border px-3 py-3">
        <Logo className="h-11 w-full rounded-md object-left" />
      </div>

      <SidebarSection
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

      <SidebarSection title={`Agentes (${enabledCount}/${AGENT_CATALOG.length})`}>
        <AgentPanel />
      </SidebarSection>

      <div className="mt-auto border-t border-sidebar-border p-3">
        <SidebarNavButton
          iconName="message-square"
          label="Chat"
          active={view === 'chat'}
          onClick={() => setView('chat')}
        />
        <SidebarNavButton
          iconName="settings"
          label="Configuracion"
          active={view === 'settings'}
          onClick={() => setView('settings')}
        />
      </div>
    </aside>
  )
}
