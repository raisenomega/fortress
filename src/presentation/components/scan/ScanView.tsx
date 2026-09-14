import { useActiveProject } from '../../stores/project-store'
import { usePushResult } from '../../stores/push-store'
import { useScanError } from '../../stores/scan-selectors'
import { useScanStore } from '../../stores/scan-store'
import { EmptyState } from '../common/EmptyState'
import { Notice } from '../common/Notice'
import { CoberturaNotice } from './CoberturaNotice'
import { ParadaEnVivo } from './ParadaEnVivo'
import { hayParadaQueEnsenar } from './parada-linea'
import { ScanHeader } from './ScanHeader'
import { ScanProgress } from './ScanProgress'
import { TableroDeHallazgos } from './TableroDeHallazgos'

export function ScanView(): React.JSX.Element {
  const project = useActiveProject()
  const projectId = project?.id ?? null
  const running = useScanStore((state) => state.runningProjectId) === projectId
  const progress = useScanStore((state) => state.progress)
  const parada = useScanStore((state) => state.parada)
  const summary = useScanStore((state) => state.lastSummary)
  const error = useScanError(projectId)
  const push = usePushResult(projectId)

  if (!project) {
    return (
      <EmptyState
        iconName="shield"
        title="Ningun proyecto seleccionado"
        hint="Agrega un proyecto y elige cual quieres auditar."
      />
    )
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <ScanHeader project={project} />

      <div className="space-y-3 px-4 py-3">
        {error ? <Notice tone="error">{error}</Notice> : null}
        {push ? <Notice tone={push.failed ? 'error' : 'ok'}>{push.output}</Notice> : null}
        {summary?.projectId === project.id && !running ? (
          <CoberturaNotice cobertura={summary.cobertura} />
        ) : null}
        {hayParadaQueEnsenar(running, parada) ? <ParadaEnVivo parada={parada} /> : null}
        {running ? <ScanProgress text={progress} /> : null}

        <TableroDeHallazgos project={project} />
      </div>
    </div>
  )
}
