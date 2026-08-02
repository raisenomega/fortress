import type { Project } from '@domain/project/project'
import { SCAN_LABEL, scanStatus } from '@domain/project/scan-status'

const DOT_CLASS = {
  'sin-escanear': 'bg-muted-foreground',
  solido: 'bg-success',
  aceptable: 'bg-medium',
  riesgo: 'bg-critical'
} as const

interface ProjectListItemProps {
  readonly project: Project
  readonly active: boolean
  readonly onSelect: (id: string) => void
}

export function ProjectListItem({
  project,
  active,
  onSelect
}: ProjectListItemProps): React.JSX.Element {
  const status = scanStatus(project)

  return (
    <button
      type="button"
      onClick={() => onSelect(project.id)}
      aria-current={active}
      title={`${project.path} — ${SCAN_LABEL[status]}`}
      className={`tap flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left ${
        active ? 'bg-accent/40 text-foreground' : 'text-muted-foreground hover:bg-secondary'
      }`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_CLASS[status]}`} />
      <span className="min-w-0 flex-1 truncate text-sm">{project.name}</span>
      <span className="font-mono text-xs text-muted-foreground">
        {status === 'sin-escanear' ? '—' : project.fortressScore}
      </span>
    </button>
  )
}
