import { AutonomousNotice } from '../settings/AutonomousNotice'
import { MainArea } from './MainArea'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { TopBar } from './TopBar'

interface AppShellProps {
  readonly onSend: (text: string) => void
}

export function AppShell({ onSend }: AppShellProps): React.JSX.Element {
  return (
    <div className="flex h-full flex-col bg-background">
      <TopBar />
      <AutonomousNotice />

      <div className="grid min-h-0 flex-1 grid-cols-[248px_1fr]">
        <Sidebar />
        <MainArea onSend={onSend} />
      </div>

      <StatusBar />
    </div>
  )
}
