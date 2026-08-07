import type { IconName } from '@domain/shared/icon-name'
import { useUiStore, type MainView } from '../../stores/ui-store'
import { SidebarNavButton } from './SidebarNavButton'

/**
 * Escaneo, Actividad y Cognition son secciones por derecho propio, no ajustes:
 * van en el cuerpo del sidebar, debajo de los agentes. En el pie solo queda lo
 * que no es trabajo del proyecto.
 */
const VIEWS: ReadonlyArray<{ view: MainView; iconName: IconName; label: string }> = [
  { view: 'scan', iconName: 'shield', label: 'Escaneo' },
  { view: 'actividad', iconName: 'zap', label: 'Actividad' },
  { view: 'cognition', iconName: 'brain', label: 'Cognition' },
  { view: 'docs', iconName: 'file-text', label: 'Documentacion' },
  { view: 'exposicion', iconName: 'shield', label: 'Superficie externa' },
  { view: 'omega', iconName: 'eye', label: 'Sentinel Omega' },
  { view: 'sistema', iconName: 'sparkles', label: 'Auto-mejora FORTRESS' },
  { view: 'genesis', iconName: 'rocket', label: 'Genesis de agentes' },
  { view: 'construir', iconName: 'hard-hat', label: 'Construir' }
]

export function SidebarViewLinks(): React.JSX.Element {
  const view = useUiStore((state) => state.view)
  const setView = useUiStore((state) => state.setView)

  return (
    <nav className="border-b border-sidebar-border px-3 py-2">
      {VIEWS.map((item) => (
        <SidebarNavButton
          key={item.view}
          iconName={item.iconName}
          label={item.label}
          active={view === item.view}
          onClick={() => setView(item.view)}
        />
      ))}
    </nav>
  )
}
