import { ChevronDown, ChevronRight } from 'lucide-react'
import { useSectionOpen, useSidebarStore, type SidebarSectionId } from '../../stores/sidebar-store'

interface SidebarSectionProps {
  readonly id: SidebarSectionId
  readonly title: string
  readonly action?: React.ReactNode
  readonly children: React.ReactNode
}

/** Plegable: con diez agentes y varios proyectos el sidebar no cabe entero. */
export function SidebarSection({
  id,
  title,
  action,
  children
}: SidebarSectionProps): React.JSX.Element {
  const open = useSectionOpen(id)
  const toggle = useSidebarStore((state) => state.toggleSection)

  return (
    <section className="border-b border-sidebar-border px-3 py-2.5 last:border-b-0">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => toggle(id)}
          aria-expanded={open}
          className="tap flex min-w-0 flex-1 items-center gap-1 px-1 py-0.5 text-left"
        >
          {open ? (
            <ChevronDown size={12} aria-hidden className="text-muted-foreground" />
          ) : (
            <ChevronRight size={12} aria-hidden className="text-muted-foreground" />
          )}
          <h4 className="truncate text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            {title}
          </h4>
        </button>
        {action}
      </header>
      {open ? <div className="mt-2">{children}</div> : null}
    </section>
  )
}
