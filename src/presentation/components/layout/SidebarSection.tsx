interface SidebarSectionProps {
  readonly title: string
  readonly action?: React.ReactNode
  readonly children: React.ReactNode
}

export function SidebarSection({
  title,
  action,
  children
}: SidebarSectionProps): React.JSX.Element {
  return (
    <section className="border-b border-sidebar-border px-3 py-3 last:border-b-0">
      <header className="mb-2 flex items-center justify-between px-2">
        <h4 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          {title}
        </h4>
        {action}
      </header>
      {children}
    </section>
  )
}
