import type { Project } from '@domain/project/project'
import { scanStatus } from '@domain/project/scan-status'
import { formatDuration, formatMoment } from '../../format/time'
import { useScanStore } from '../../stores/scan-store'
import { ScoreGauge } from '../dashboard/ScoreGauge'
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

/**
 * La identidad del proyecto en UNA fila: el score ancla a la izquierda, nombre y
 * ruta en medio, los botones a la derecha. Una sola linea porque vive dentro del
 * bloque FIJO (`CabeceraFija`), y lo que aqui se apile lo pagan las filas.
 *
 * El nombre va discreto, no como titulo de pagina: el TopBar ya lo dice arriba y
 * el ancla visual de esta pantalla es el circulo del score.
 */
export function ScanHeader({ project }: ScanHeaderProps): React.JSX.Element {
  const summary = useScanStore((state) => state.lastSummary)
  const enCurso = useScanStore((state) => state.runningProjectId) === project.id
  const scanned = scanStatus(project) !== 'sin-escanear'
  const duration = summary?.projectId === project.id ? summary.durationMs : null

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <ScoreGauge score={project.fortressScore} scanned={scanned} enCurso={enCurso} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{project.name}</p>
        <p className="truncate font-mono text-[11px] text-muted-foreground">{project.path}</p>
        <p className="text-[11px] text-muted-foreground">{describeLastScan(project, duration)}</p>
      </div>

      <ScanActions project={project} />
    </div>
  )
}
