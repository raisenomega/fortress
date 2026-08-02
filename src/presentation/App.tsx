import { AppShell } from './components/layout/AppShell'
import { OnboardingScreen } from './components/onboarding/OnboardingScreen'
import { AddProjectDialog } from './components/projects/AddProjectDialog'
import { useBootstrap } from './hooks/useBootstrap'
import { sendMessage } from './services/chat-service'
import { useAgentStore } from './stores/agent-store'
import { useProjectStore } from './stores/project-store'
import { useSettingsStore } from './stores/settings-store'
import { useUiStore } from './stores/ui-store'

export function App(): React.JSX.Element {
  const mode = useSettingsStore((state) => state.mode)
  const hasApiKey = useSettingsStore((state) => state.hasApiKey)
  const apiKeyChecked = useSettingsStore((state) => state.apiKeyChecked)
  const enabledAgents = useAgentStore((state) => state.enabled)
  const activeProjectId = useProjectStore((state) => state.activeProjectId)
  const addProjectOpen = useUiStore((state) => state.addProjectOpen)
  const setAddProjectOpen = useUiStore((state) => state.setAddProjectOpen)
  const onboardingDismissed = useUiStore((state) => state.onboardingDismissed)
  const dismissOnboarding = useUiStore((state) => state.dismissOnboarding)

  useBootstrap()

  function handleSend(prompt: string): void {
    if (!activeProjectId) return
    void sendMessage({ projectId: activeProjectId, prompt, mode, enabledAgents })
  }

  // Se espera a saber si hay key para no parpadear el onboarding al arrancar.
  if (apiKeyChecked && !hasApiKey && !onboardingDismissed) {
    return <OnboardingScreen onSkip={dismissOnboarding} />
  }

  return (
    <>
      <AppShell onSend={handleSend} />
      {addProjectOpen ? <AddProjectDialog onClose={() => setAddProjectOpen(false)} /> : null}
    </>
  )
}
