import { useActiveProject } from '../../stores/project-store'
import { usePushResult } from '../../stores/push-store'
import { useProjectFindings, useScanError } from '../../stores/scan-selectors'
import { useScanStore } from '../../stores/scan-store'
// prettier-ignore
import { dismissFinding, mitigateFinding, reopenFinding, unmitigateFinding } from '../../services/dismiss-service'
import { proposeRepair } from '../../services/repair-service'
import { verificarHallazgo } from '../../services/verificar-service'
import { useRepairStore } from '../../stores/repair-store'
import { EmptyState } from '../common/EmptyState'
import { Notice } from '../common/Notice'
import { CoberturaNotice } from './CoberturaNotice'
import { FindingsTable } from './FindingsTable'
import { ParadaEnVivo } from './ParadaEnVivo'
import { hayParadaQueEnsenar } from './parada-linea'
import { ScanHeader } from './ScanHeader'
import { ScanProgress } from './ScanProgress'

export function ScanView(): React.JSX.Element {
  const project = useActiveProject()
  const projectId = project?.id ?? null
  const findings = useProjectFindings(projectId)
  const running = useScanStore((state) => state.runningProjectId) === projectId
  const progress = useScanStore((state) => state.progress)
  const parada = useScanStore((state) => state.parada)
  const summary = useScanStore((state) => state.lastSummary)
  const error = useScanError(projectId)
  const push = usePushResult(projectId)
  const motorOcupado = useRepairStore((state) => state.busy) // un solo carril

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

        <FindingsTable
          project={project}
          findings={findings}
          onDismiss={(id) => void dismissFinding(project.id, id)}
          onReopen={(id) => void reopenFinding(project.id, id)}
          onMitigate={(id, nota) => void mitigateFinding(project.id, id, nota)}
          onUnmitigate={(id) => void unmitigateFinding(project.id, id)}
          onRepair={(id) => void proposeRepair(project.id, id)}
          onVerificar={(id) => void verificarHallazgo(project.id, id)}
          ocupado={motorOcupado}
        />
      </div>
    </div>
  )
}
