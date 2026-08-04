import type { IconName } from '@domain/shared/icon-name'
import { useUiStore, type MainView } from '../../stores/ui-store'
import { SidebarNavButton } from './SidebarNavButton'

/** Pie del sidebar: solo lo que no pertenece a un proyecto concreto. */
const ITEMS: ReadonlyArray<{ view: MainView; iconName: IconName; label: string }> = [
  { view: 'chat', iconName: 'message-square', label: 'Chat' },
  { view: 'settings', iconName: 'settings', label: 'Configuracion' },
  { view: 'conectores', iconName: 'package', label: 'Conectores' }
]

export function SidebarNav(): React.JSX.Element {
  const view = useUiStore((state) => state.view)
  const setView = useUiStore((state) => state.setView)

  return (
    <div className="mt-auto border-t border-sidebar-border p-3">
      {ITEMS.map((item) => (
        <SidebarNavButton
          key={item.view}
          iconName={item.iconName}
          label={item.label}
          active={view === item.view}
          onClick={() => setView(item.view)}
        />
      ))}
    </div>
  )
}
