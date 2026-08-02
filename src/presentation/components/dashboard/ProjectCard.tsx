import type { Project } from '@domain/project/project'
import { SCAN_LABEL, pushVerdict, scanStatus } from '@domain/project/scan-status'
import { ScoreGauge } from './ScoreGauge'

const PUSH_LABEL = {
  listo: '✅ Push listo',
  bloqueado: '⛔ Push bloqueado',
  desconocido: '· Push sin verificar'
} as const

interface ProjectCardProps {
  readonly project: Project
  readonly active: boolean
  readonly onSelect: (id: string) => void
}

export function ProjectCard({ project, active, onSelect }: ProjectCardProps): React.JSX.Element {
  const status = scanStatus(project)

  return (
    <button
      type="button"
      onClick={() => onSelect(project.id)}
      aria-current={active}
      title={project.path}
      className={`tap flex w-52 shrink-0 items-center gap-3 rounded-lg border p-3 text-left ${
        active ? 'border-primary/50 bg-accent/20' : 'border-border bg-card hover:border-primary/30'
      }`}
    >
      <ScoreGauge score={project.fortressScore} scanned={status !== 'sin-escanear'} />

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-bold text-foreground">{project.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {project.stack || 'stack sin detectar'}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">{SCAN_LABEL[status]}</p>
        <p className="text-[11px] text-muted-foreground">{PUSH_LABEL[pushVerdict(project)]}</p>
      </div>
    </button>
  )
}
