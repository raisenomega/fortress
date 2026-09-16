import type { RefObject } from 'react'
import type { Project } from '@domain/project/project'
import { scanStatus } from '@domain/project/scan-status'
import { formatDuration, formatMoment } from '../../format/time'
import { useScanStore } from '../../stores/scan-store'
import { ScoreGauge } from '../dashboard/ScoreGauge'
import { ScanActions } from './ScanActions'

interface ScanHeaderProps {
  readonly project: Project
  /** Marca la fila FIJA para medir su alto real (ver `useFranjaFija`). */
  readonly cabecera: RefObject<HTMLDivElement | null>
}

const FIJA =
  'bg-background sticky top-0 z-30 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-2'

/** Cuando dice "sin escanear" no hay score que mostrar: el 0 no significa malo. */
function describeLastScan(project: Project, durationMs: number | null): string {
  if (project.lastScan === null) return 'Sin escanear'

  const when = `Ultimo escaneo: ${formatMoment(project.lastScan)}`
  return durationMs === null ? when : `${when} · duro ${formatDuration(durationMs)}`
}

/**
 * Dos pisos. El de arriba —nombre y botones— se queda FIJO: con 161 filas el
 * operador necesita Escanear, Verificar y Push sin volver arriba del todo. El de
 * abajo —score, ruta y fecha— se va con el scroll: es contexto que se lee una
 * vez, y el circulo de 64px robaria esa altura a las filas para siempre.
 */
export function ScanHeader({ project, cabecera }: ScanHeaderProps): React.JSX.Element {
  const summary = useScanStore((state) => state.lastSummary)
  const enCurso = useScanStore((state) => state.runningProjectId) === project.id
  const scanned = scanStatus(project) !== 'sin-escanear'
  const duration = summary?.projectId === project.id ? summary.durationMs : null

  return (
    <>
      <div ref={cabecera} className={FIJA}>
        <h2 className="min-w-0 flex-1 truncate font-display text-lg font-bold text-foreground">
          {project.name}
        </h2>
        <ScanActions project={project} />
      </div>

      <header className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-3">
        <ScoreGauge score={project.fortressScore} scanned={scanned} enCurso={enCurso} />

        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[11px] text-muted-foreground">{project.path}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {describeLastScan(project, duration)}
          </p>
        </div>
      </header>
    </>
  )
}
