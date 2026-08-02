import type { ScanRecord } from '@domain/scan/scan-record'
import { useProjectStore } from '../../stores/project-store'
import { Sparkline } from '../charts/Sparkline'

interface ScoreTrendProps {
  readonly scans: readonly ScanRecord[]
}

/** Con un solo escaneo no hay tendencia que ensenar, y se dice. */
export function ScoreTrend({ scans }: ScoreTrendProps): React.JSX.Element {
  const projects = useProjectStore((state) => state.projects)

  const conHistoria = projects
    .map((project) => ({
      project,
      scores: scans.filter((scan) => scan.projectId === project.id).map((scan) => scan.score)
    }))
    .filter((row) => row.scores.length > 0)

  if (conHistoria.length === 0) {
    return <p className="text-xs text-muted-foreground">Sin escaneos en este periodo.</p>
  }

  return (
    <ul className="space-y-2">
      {conHistoria.map(({ project, scores }) => (
        <li key={project.id} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-foreground">{project.name}</span>
          <Sparkline points={scores} />
          <span className="font-mono text-sm text-foreground">{scores[scores.length - 1]}</span>
          {scores.length < 2 ? (
            <span className="text-[10px] text-muted-foreground">un solo escaneo</span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
