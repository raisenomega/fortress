import type { Project } from '@domain/project/project'
import { scanStatus } from '@domain/project/scan-status'
import { formatDuration, formatMoment } from '../../format/time'
import { useProjectCounts } from '../../stores/scan-selectors'
import { useScanStore } from '../../stores/scan-store'
import { ScoreGauge } from '../dashboard/ScoreGauge'
import { CountsStrip } from './CountsStrip'
import { ScanActions } from './ScanActions'

interface ScanHeaderProps {
  readonly project: Project
}

/** Cuando dice "sin escanear" no hay score que mostrar: el 0 no significa malo. */
function describeLastScan(project: Project, durationMs: number | null): string {
  if (project.lastScan === null) return 'Sin escanear'

  const when = `Ultimo escaneo: ${formatMoment(project.lastScan)}`
  return durationMs === null ? when : `${when} · duro ${formatDuration(durationMs)}`
}

export function ScanHeader({ project }: ScanHeaderProps): React.JSX.Element {
  const counts = useProjectCounts(project.id)
  const summary = useScanStore((state) => state.lastSummary)
  const enCurso = useScanStore((state) => state.runningProjectId) === project.id
  const scanned = scanStatus(project) !== 'sin-escanear'
  const duration = summary?.projectId === project.id ? summary.durationMs : null

  return (
    <header className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-3">
      <ScoreGauge score={project.fortressScore} scanned={scanned} enCurso={enCurso} />

      <div className="min-w-0 flex-1">
        <h2 className="truncate font-display text-lg font-bold text-foreground">{project.name}</h2>
        <p className="truncate font-mono text-[11px] text-muted-foreground">{project.path}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {describeLastScan(project, duration)}
        </p>
      </div>

      <CountsStrip counts={counts} scanned={scanned} />
      <ScanActions project={project} />
    </header>
  )
}
