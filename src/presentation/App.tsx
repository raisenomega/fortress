import { useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { AddProjectDialog } from './components/projects/AddProjectDialog'
import { ApiKeyDialog } from './components/settings/ApiKeyDialog'
import { useBootstrap } from './hooks/useBootstrap'
import { sendMessage } from './services/chat-service'
import { useAgentStore } from './stores/agent-store'
import { useProjectStore } from './stores/project-store'
import { useSettingsStore } from './stores/settings-store'

type OpenDialog = 'none' | 'settings' | 'add-project'

export function App(): React.JSX.Element {
  const [dialog, setDialog] = useState<OpenDialog>('none')
  const mode = useSettingsStore((state) => state.mode)
  const enabledAgents = useAgentStore((state) => state.enabled)
  const activeProjectId = useProjectStore((state) => state.activeProjectId)

  useBootstrap()

  function handleSend(prompt: string): void {
    if (!activeProjectId) return
    void sendMessage({ projectId: activeProjectId, prompt, mode, enabledAgents })
  }

  const close = (): void => setDialog('none')

  return (
    <>
      <AppShell
        onAddProject={() => setDialog('add-project')}
        onOpenSettings={() => setDialog('settings')}
        onSend={handleSend}
      />
      {dialog === 'settings' ? <ApiKeyDialog onClose={close} /> : null}
      {dialog === 'add-project' ? <AddProjectDialog onClose={close} /> : null}
    </>
  )
}
