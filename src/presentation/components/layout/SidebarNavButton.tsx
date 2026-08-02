interface SidebarNavButtonProps {
  readonly icon: string
  readonly label: string
  readonly active: boolean
  readonly onClick: () => void
}

export function SidebarNavButton({
  icon,
  label,
  active,
  onClick
}: SidebarNavButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active}
      className={`tap flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
        active ? 'bg-accent/40 text-foreground' : 'text-muted-foreground hover:bg-secondary'
      }`}
    >
      <span aria-hidden>{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  )
}
