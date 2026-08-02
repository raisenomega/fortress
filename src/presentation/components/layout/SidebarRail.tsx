import { AGENT_CATALOG } from '@domain/agent/agent-catalog'
import type { IconName } from '@domain/shared/icon-name'
import { useUiStore, type MainView } from '../../stores/ui-store'
import { Icon } from '../common/Icon'

/** Sidebar plegado: solo iconos, para dejarle la pantalla al contenido. */
const RAIL: ReadonlyArray<{ view: MainView; iconName: IconName; label: string }> = [
  { view: 'chat', iconName: 'message-square', label: 'Chat' },
  { view: 'scan', iconName: 'shield', label: 'Escaneo' },
  { view: 'actividad', iconName: 'zap', label: 'Actividad' },
  { view: 'cognition', iconName: 'brain', label: 'Cognition' },
  { view: 'exposicion', iconName: 'shield', label: 'Superficie externa' },
  { view: 'settings', iconName: 'settings', label: 'Configuracion' }
]

export function SidebarRail(): React.JSX.Element {
  const view = useUiStore((state) => state.view)
  const setView = useUiStore((state) => state.setView)
  const enabled = AGENT_CATALOG.length

  return (
    <nav className="flex flex-1 flex-col items-center gap-1 py-2">
      {RAIL.map((item) => (
        <button
          key={item.view}
          type="button"
          onClick={() => setView(item.view)}
          title={item.label}
          aria-current={view === item.view}
          className={`tap rounded-md p-2 ${
            view === item.view
              ? 'bg-accent/40 text-foreground'
              : 'text-muted-foreground hover:bg-secondary'
          }`}
        >
          <Icon name={item.iconName} size={16} />
        </button>
      ))}
      <span className="sr-only">{enabled} agentes</span>
    </nav>
  )
}
