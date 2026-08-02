import { newId, nowIso } from '@domain/shared/id'
import { AppShell } from './components/layout/AppShell'
import { useChatStore } from './stores/chat-store'
import { useProjectStore } from './stores/project-store'
import { useSettingsStore } from './stores/settings-store'

export function App(): React.JSX.Element {
  const appendMessage = useChatStore((state) => state.appendMessage)
  const mode = useSettingsStore((state) => state.mode)
  const activeProjectId = useProjectStore((state) => state.activeProjectId)

  /**
   * El mensaje del operador ya se registra; la respuesta del asistente
   * llega cuando se conecte la Claude API en el paso 6.
   */
  function handleSend(text: string): void {
    if (!activeProjectId) return
    appendMessage({
      id: newId(),
      projectId: activeProjectId,
      role: 'user',
      content: text,
      agentId: null,
      mode,
      createdAt: nowIso(),
      pending: false
    })
  }

  return <AppShell onSend={handleSend} />
}
