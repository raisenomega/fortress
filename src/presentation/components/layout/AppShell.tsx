import { ChatWindow } from '../chat/ChatWindow'
import { MultiProjectView } from '../dashboard/MultiProjectView'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { TopBar } from './TopBar'

interface AppShellProps {
  readonly onAddProject?: () => void
  readonly onOpenSettings: () => void
  readonly onSend: (text: string) => void
}

export function AppShell({
  onAddProject,
  onOpenSettings,
  onSend
}: AppShellProps): React.JSX.Element {
  return (
    <div className="flex h-full flex-col bg-background">
      <TopBar onOpenSettings={onOpenSettings} />

      <div className="grid min-h-0 flex-1 grid-cols-[248px_1fr]">
        <Sidebar onAddProject={onAddProject} />

        <main className="flex min-h-0 flex-col overflow-hidden">
          <MultiProjectView />
          <div className="min-h-0 flex-1">
            <ChatWindow onSend={onSend} />
          </div>
        </main>
      </div>

      <StatusBar />
    </div>
  )
}
