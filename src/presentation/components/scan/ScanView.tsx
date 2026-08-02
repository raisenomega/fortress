import { useActiveProject } from '../../stores/project-store'
import { usePushResult } from '../../stores/push-store'
import { useProjectFindings, useScanError } from '../../stores/scan-selectors'
import { useScanStore } from '../../stores/scan-store'
import { EmptyState } from '../common/EmptyState'
import { Notice } from '../common/Notice'
import { FindingsTable } from './FindingsTable'
import { ScanHeader } from './ScanHeader'
import { ScanProgress } from './ScanProgress'

export function ScanView(): React.JSX.Element {
  const project = useActiveProject()
  const projectId = project?.id ?? null
  const findings = useProjectFindings(projectId)
  const running = useScanStore((state) => state.runningProjectId) === projectId
  const progress = useScanStore((state) => state.progress)
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
        {running ? <ScanProgress text={progress} /> : null}

        <FindingsTable project={project} findings={findings} />
      </div>
    </div>
  )
}
