import type { Project } from '@domain/project/project'
import { scanStatus } from '@domain/project/scan-status'
import { LoopHud } from './LoopHud'
import { LoopToggle } from './LoopToggle'
import { TrustToggle } from './TrustToggle'

const DOT: Record<string, string> = {
  'sin-escanear': 'bg-muted-foreground',
  solido: 'bg-success',
  aceptable: 'bg-medium',
  riesgo: 'bg-critical'
}

interface ChatHeaderProps {
  readonly project: Project
}

/**
 * Franja que deja claro EN QUE proyecto estas escribiendo. Con dos proyectos
 * el chat se ve igual; sin esto, es facil mandarle a uno lo que era para el
 * otro. El punto de color y la rama refuerzan de un vistazo cual es.
 */
export function ChatHeader({ project }: ChatHeaderProps): React.JSX.Element {
  return (
    <header className="flex shrink-0 items-center gap-2 border-b border-border bg-secondary/30 px-4 py-2">
      <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[scanStatus(project)]}`} />
      <span className="text-sm font-semibold text-foreground">{project.name}</span>
      <span className="truncate font-mono text-[11px] text-muted-foreground">
        {project.path}
        {project.gitBranch ? ` · ${project.gitBranch}` : ''}
      </span>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <LoopHud project={project} />
        <TrustToggle project={project} />
        <LoopToggle project={project} />
      </div>
    </header>
  )
}
