import { useUiStore } from '../../stores/ui-store'
import { ChatWindow } from '../chat/ChatWindow'
import { MultiProjectView } from '../dashboard/MultiProjectView'
import { CognitionView } from '../cognition/CognitionView'
import { ScanView } from '../scan/ScanView'
import { SettingsView } from '../settings/SettingsView'

interface MainAreaProps {
  readonly onSend: (text: string) => void
}

export function MainArea({ onSend }: MainAreaProps): React.JSX.Element {
  const view = useUiStore((state) => state.view)

  if (view === 'settings') {
    return (
      <main className="min-h-0 overflow-hidden">
        <SettingsView />
      </main>
    )
  }

  if (view === 'scan') {
    return (
      <main className="min-h-0 overflow-hidden">
        <ScanView />
      </main>
    )
  }

  if (view === 'cognition') {
    return (
      <main className="min-h-0 overflow-hidden">
        <CognitionView />
      </main>
    )
  }

  return (
    <main className="flex min-h-0 flex-col overflow-hidden">
      <MultiProjectView />
      <div className="min-h-0 flex-1">
        <ChatWindow onSend={onSend} />
      </div>
    </main>
  )
}
