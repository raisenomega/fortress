import { useActiveProject } from '../../stores/project-store'
import { usePushStore } from '../../stores/push-store'
import { useProjectFindings, useScanStore } from '../../stores/scan-store'
import { EmptyState } from '../common/EmptyState'
import { Notice } from '../common/Notice'
import { FindingsTable } from './FindingsTable'
import { ScanHeader } from './ScanHeader'
import { ScanProgress } from './ScanProgress'

export function ScanView(): React.JSX.Element {
  const project = useActiveProject()
  const findings = useProjectFindings(project?.id ?? null)
  const running = useScanStore((state) => state.runningProjectId) === project?.id
  const progress = useScanStore((state) => state.progress)
  const error = useScanStore((state) => state.error)
  const pushOutput = usePushStore((state) => state.output)
  const pushFailed = usePushStore((state) => state.failed)

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
        {pushOutput ? <Notice tone={pushFailed ? 'error' : 'ok'}>{pushOutput}</Notice> : null}
        {running ? <ScanProgress text={progress} /> : null}

        <FindingsTable project={project} findings={findings} />
      </div>
    </div>
  )
}
