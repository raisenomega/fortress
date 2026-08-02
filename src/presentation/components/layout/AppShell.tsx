import { AutonomousNotice } from '../settings/AutonomousNotice'
import { useSidebarStore } from '../../stores/sidebar-store'
import { MainArea } from './MainArea'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { TopBar } from './TopBar'

interface AppShellProps {
  readonly onSend: (text: string) => void
  /** Plan pendiente de aprobacion, encima del chat. */
  readonly plan: React.ReactNode
}

export function AppShell({ onSend, plan }: AppShellProps): React.JSX.Element {
  const collapsed = useSidebarStore((state) => state.collapsed)

  return (
    <div className="flex h-full flex-col bg-background">
      <TopBar />
      <AutonomousNotice />

      <div
        className={`grid min-h-0 flex-1 ${collapsed ? 'grid-cols-[52px_1fr]' : 'grid-cols-[248px_1fr]'}`}
      >
        <Sidebar />
        <MainArea onSend={onSend} plan={plan} />
      </div>

      <StatusBar />
    </div>
  )
}
