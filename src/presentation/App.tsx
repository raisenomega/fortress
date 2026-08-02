import { AppShell } from './components/layout/AppShell'
import { useBootstrap } from './hooks/useBootstrap'
import { persistMessage } from './services/chat-service'
import { useProjectStore } from './stores/project-store'
import { useSettingsStore } from './stores/settings-store'

export function App(): React.JSX.Element {
  const mode = useSettingsStore((state) => state.mode)
  const activeProjectId = useProjectStore((state) => state.activeProjectId)

  useBootstrap()

  /**
   * Guarda el mensaje del operador en SQLite. La respuesta del asistente
   * llega cuando se conecte la Claude API en el paso 6.
   */
  async function handleSend(text: string): Promise<void> {
    if (!activeProjectId) return
    await persistMessage({
      projectId: activeProjectId,
      role: 'user',
      content: text,
      agentId: null,
      mode
    })
  }

  return <AppShell onSend={(text) => void handleSend(text)} />
}
