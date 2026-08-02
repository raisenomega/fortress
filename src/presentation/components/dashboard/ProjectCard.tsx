import type { Project } from '@domain/project/project'
import { PUSH_REASON, pushState, type PushState } from '@domain/project/push-readiness'
import { SCAN_LABEL, scanStatus } from '@domain/project/scan-status'
import type { IconName } from '@domain/shared/icon-name'
import { useProjectCounts } from '../../stores/scan-selectors'
import { Icon } from '../common/Icon'
import { ScoreGauge } from './ScoreGauge'

const PUSH: Record<PushState, { iconName: IconName; label: string; className: string }> = {
  listo: { iconName: 'check-circle', label: 'Push listo', className: 'text-success' },
  criticals: { iconName: 'shield-off', label: 'Push bloqueado', className: 'text-critical' },
  'sin-escanear': { iconName: 'circle', label: 'Push sin verificar', className: '' },
  'sin-remote': { iconName: 'circle', label: 'Sin remoto git', className: '' }
}

interface ProjectCardProps {
  readonly project: Project
  readonly active: boolean
  readonly onSelect: (id: string) => void
}

export function ProjectCard({ project, active, onSelect }: ProjectCardProps): React.JSX.Element {
  const status = scanStatus(project)
  const counts = useProjectCounts(project.id)
  const state = pushState(project, counts)
  const push = PUSH[state]

  return (
    <button
      type="button"
      onClick={() => onSelect(project.id)}
      aria-current={active}
      title={`${project.path}\n${PUSH_REASON[state]}`}
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
        {counts.CRITICAL > 0 ? (
          <p className="text-[11px] font-semibold text-critical">{counts.CRITICAL} CRITICAL</p>
        ) : null}
        <p
          className={`flex items-center gap-1 text-[11px] ${push.className || 'text-muted-foreground'}`}
        >
          <Icon name={push.iconName} size={11} />
          {push.label}
        </p>
      </div>
    </button>
  )
}
