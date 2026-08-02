import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useSidebarStore } from '../../stores/sidebar-store'

/** Plegar el sidebar deja ~200px mas de ancho al panel que se este mirando. */
export function SidebarToggle(): React.JSX.Element {
  const collapsed = useSidebarStore((state) => state.collapsed)
  const toggle = useSidebarStore((state) => state.toggleCollapsed)

  return (
    <button
      type="button"
      onClick={toggle}
      data-sidebar-toggle
      aria-expanded={!collapsed}
      title={collapsed ? 'Abrir el panel lateral' : 'Plegar el panel lateral'}
      className="tap shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
    >
      {collapsed ? (
        <PanelLeftOpen size={15} aria-hidden />
      ) : (
        <PanelLeftClose size={15} aria-hidden />
      )}
    </button>
  )
}
