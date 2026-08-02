import { useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { ApiKeyDialog } from './components/settings/ApiKeyDialog'
import { useBootstrap } from './hooks/useBootstrap'
import { sendMessage } from './services/chat-service'
import { useAgentStore } from './stores/agent-store'
import { useProjectStore } from './stores/project-store'
import { useSettingsStore } from './stores/settings-store'

export function App(): React.JSX.Element {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const mode = useSettingsStore((state) => state.mode)
  const enabledAgents = useAgentStore((state) => state.enabled)
  const activeProjectId = useProjectStore((state) => state.activeProjectId)

  useBootstrap()

  function handleSend(prompt: string): void {
    if (!activeProjectId) return
    void sendMessage({ projectId: activeProjectId, prompt, mode, enabledAgents })
  }

  return (
    <>
      <AppShell onOpenSettings={() => setSettingsOpen(true)} onSend={handleSend} />
      {settingsOpen ? <ApiKeyDialog onClose={() => setSettingsOpen(false)} /> : null}
    </>
  )
}
