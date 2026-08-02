import type { Project } from '@domain/project/project'
import { pushState } from '@domain/project/push-readiness'
import { pushProject } from '../../services/push-service'
import { runScan } from '../../services/scan-service'
import { usePushStore } from '../../stores/push-store'
import { useProjectCounts, useScanStore } from '../../stores/scan-store'
import { PushButton } from './PushButton'
import { ScanButton } from './ScanButton'

interface ScanActionsProps {
  readonly project: Project
}

export function ScanActions({ project }: ScanActionsProps): React.JSX.Element {
  const runningProjectId = useScanStore((state) => state.runningProjectId)
  const pushingProjectId = usePushStore((state) => state.pushingProjectId)
  const counts = useProjectCounts(project.id)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ScanButton
        running={runningProjectId === project.id}
        busyElsewhere={runningProjectId !== null && runningProjectId !== project.id}
        onScan={() => void runScan(project.id)}
      />
      <PushButton
        state={pushState(project, counts)}
        pushing={pushingProjectId === project.id}
        onPush={() => void pushProject(project.id)}
      />
    </div>
  )
}
