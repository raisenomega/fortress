import { X } from 'lucide-react'
import type { Project } from '@domain/project/project'
import { SCAN_LABEL, scanStatus } from '@domain/project/scan-status'

const DOT_CLASS = {
  nuevo: 'bg-primary',
  'sin-escanear': 'bg-muted-foreground',
  solido: 'bg-success',
  aceptable: 'bg-medium',
  riesgo: 'bg-critical'
} as const

interface ProjectListItemProps {
  readonly project: Project
  readonly active: boolean
  readonly onSelect: (id: string) => void
  readonly onRemove: (project: Project) => void
}

/**
 * Fila de proyecto. La X quita el proyecto de FORTRESS; va en su propio boton
 * (no anidado) y solo asoma al pasar por encima, para no invitar a borrar sin
 * querer. Quitarlo no toca la carpeta en disco: solo lo saca de la barra.
 */
export function ProjectListItem({
  project,
  active,
  onSelect,
  onRemove
}: ProjectListItemProps): React.JSX.Element {
  const status = scanStatus(project)

  return (
    <div
      className={`group flex items-center gap-2 rounded-md px-2 py-1.5 ${
        active ? 'bg-accent/40' : 'hover:bg-secondary'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(project.id)}
        aria-current={active}
        title={`${project.path} — ${SCAN_LABEL[status]}`}
        className={`tap flex min-w-0 flex-1 items-center gap-2 text-left ${
          active ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_CLASS[status]}`} />
        <span className="min-w-0 flex-1 truncate text-sm">{project.name}</span>
        {status === 'nuevo' ? (
          <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
            nuevo
          </span>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">
            {status === 'sin-escanear' ? '—' : project.fortressScore}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onRemove(project)}
        aria-label={`Quitar ${project.name}`}
        title="Quitar de FORTRESS (no borra la carpeta)"
        className="tap shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-critical"
      >
        <X size={13} aria-hidden />
      </button>
    </div>
  )
}
