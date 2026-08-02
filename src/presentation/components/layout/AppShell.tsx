import { ChatWindow } from '../chat/ChatWindow'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { TopBar } from './TopBar'

interface AppShellProps {
  readonly onAddProject?: () => void
  readonly onSend: (text: string) => void
}

export function AppShell({ onAddProject, onSend }: AppShellProps): React.JSX.Element {
  return (
    <div className="flex h-full flex-col bg-background">
      <TopBar />

      <div className="grid min-h-0 flex-1 grid-cols-[248px_1fr]">
        <Sidebar onAddProject={onAddProject} />
        <main className="min-h-0 overflow-hidden">
          <ChatWindow onSend={onSend} />
        </main>
      </div>

      <StatusBar />
    </div>
  )
}
