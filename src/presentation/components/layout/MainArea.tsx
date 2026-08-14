import { useUiStore, type MainView } from '../../stores/ui-store'
import { ChatWindow } from '../chat/ChatWindow'
import { CognitionView } from '../cognition/CognitionView'
import { DocsView } from '../docs/DocsView'
import { ConnectorsView } from '../connectors/ConnectorsView'
import { ConstruirView } from '../construir/ConstruirView'
import { MultiProjectView } from '../dashboard/MultiProjectView'
import { MotorView } from '../system/MotorView'
import { OmegaView } from '../omega/OmegaView'
import { PerformanceView } from '../performance/PerformanceView'
import { PostureView } from '../posture/PostureView'
import { GenesisView } from '../genesis/GenesisView'
import { ScanView } from '../scan/ScanView'
import { SelfImprovementView } from '../system/SelfImprovementView'
import { SettingsView } from '../settings/SettingsView'
import { TimelineView } from '../timeline/TimelineView'

/**
 * Paneles a pantalla completa. El chat no esta aqui porque es el unico que
 * comparte el area con la franja de proyectos.
 */
const PANELS: Partial<Record<MainView, () => React.JSX.Element>> = {
  scan: () => <ScanView />,
  actividad: () => <TimelineView />,
  cognition: () => <CognitionView />,
  exposicion: () => <PostureView />,
  rendimiento: () => <PerformanceView />,
  settings: () => <SettingsView />,
  conectores: () => <ConnectorsView />,
  omega: () => <OmegaView />,
  sistema: () => <SelfImprovementView />,
  motor: () => <MotorView />,
  genesis: () => <GenesisView />,
  construir: () => <ConstruirView />,
  docs: () => <DocsView />
}

interface MainAreaProps {
  readonly onSend: (text: string) => void
  readonly plan: React.ReactNode
}

export function MainArea({ onSend, plan }: MainAreaProps): React.JSX.Element {
  const view = useUiStore((state) => state.view)
  const panel = PANELS[view]

  if (panel) return <main className="min-h-0 overflow-hidden">{panel()}</main>

  return (
    <main className="flex min-h-0 flex-col overflow-hidden">
      <MultiProjectView />
      {plan}
      <div className="min-h-0 flex-1">
        <ChatWindow onSend={onSend} />
      </div>
    </main>
  )
}
