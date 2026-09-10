import type { Project } from '@domain/project/project'
import { pushState } from '@domain/project/push-readiness'
import { pushProject } from '../../services/push-service'
import { auditQuality } from '../../services/quality-service'
import { stopScan } from '../../services/detener-escaneo'
import { runScan } from '../../services/scan-service'
import { usePushStore } from '../../stores/push-store'
import { useQualityStore } from '../../stores/quality-store'
import { useProjectCounts, useProjectFindings } from '../../stores/scan-selectors'
import { useScanStore } from '../../stores/scan-store'
import { AskChatButton } from './AskChatButton'
import { botonDeEscaneo } from './boton-de-escaneo'
import { DetenerScanButton } from './DetenerScanButton'
import { PushButton } from './PushButton'
import { QualityButton } from './QualityButton'
import { ScanButton } from './ScanButton'

interface ScanActionsProps {
  readonly project: Project
}

export function ScanActions({ project }: ScanActionsProps): React.JSX.Element {
  const runningProjectId = useScanStore((state) => state.runningProjectId)
  const auditingProjectId = useQualityStore((state) => state.runningProjectId)
  const pushingProjectId = usePushStore((state) => state.pushingProjectId)
  const counts = useProjectCounts(project.id)
  const findings = useProjectFindings(project.id)
  const boton = botonDeEscaneo(runningProjectId, project.id)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {boton === 'detener' ? (
        <DetenerScanButton onStop={() => void stopScan(project.id)} />
      ) : (
        <ScanButton
          running={false}
          busyElsewhere={boton === 'ocupado'}
          onScan={() => void runScan(project.id)}
        />
      )}
      <QualityButton
        running={auditingProjectId === project.id}
        busyElsewhere={auditingProjectId !== null && auditingProjectId !== project.id}
        trusted={project.trusted}
        onAudit={() => void auditQuality(project.id)}
      />
      <AskChatButton projectName={project.name} findings={findings} />
      <PushButton
        state={pushState(project, counts)}
        pushing={pushingProjectId === project.id}
        onPush={() => void pushProject(project.id)}
      />
    </div>
  )
}
