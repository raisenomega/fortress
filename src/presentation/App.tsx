import { AgentDetailModal } from './components/agents/AgentDetailModal'
import { CapabilityModal } from './components/system/CapabilityModal'
import { WorkflowPlanCard } from './components/workflow/WorkflowPlanCard'
import { HealthPanel } from './components/health/HealthPanel'
import { ProjectDialogs } from './components/newproject/ProjectDialogs'
import { Toaster } from './components/common/Toaster'
import { AppShell } from './components/layout/AppShell'
import { OnboardingScreen } from './components/onboarding/OnboardingScreen'
import { useBootstrap } from './hooks/useBootstrap'
import { useCargarColaDelLazo } from './hooks/useCargarColaDelLazo'
import { useArbolDelLazo } from './hooks/useArbolDelLazo'
import { useExcludedAgents } from './stores/agent-store'
import { useHealthStore } from './stores/health-store'
import { useProjectStore } from './stores/project-store'
import { useSettingsStore } from './stores/settings-store'
import { useUiStore } from './stores/ui-store'
import { useWorkflowGate } from './hooks/useWorkflowGate'

export function App(): React.JSX.Element {
  const mode = useSettingsStore((state) => state.mode)
  const hasApiKey = useSettingsStore((state) => state.hasApiKey)
  const apiKeyChecked = useSettingsStore((state) => state.apiKeyChecked)
  const excludedAgents = useExcludedAgents()
  const activeProjectId = useProjectStore((state) => state.activeProjectId)
  const onboardingDismissed = useUiStore((state) => state.onboardingDismissed)
  const dismissOnboarding = useUiStore((state) => state.dismissOnboarding)
  const healthPanelOpen = useHealthStore((state) => state.panelOpen)
  const openAgentId = useUiStore((state) => state.openAgentId)
  const setOpenAgent = useUiStore((state) => state.setOpenAgent)
  const openCapabilityId = useUiStore((state) => state.openCapabilityId)
  const setOpenCapability = useUiStore((state) => state.setOpenCapability)

  const gate = useWorkflowGate(activeProjectId, mode, excludedAgents)
  useBootstrap()
  useCargarColaDelLazo() // congela la cola del lazo al encenderlo (ATERRIZAJE-1)
  useArbolDelLazo() // stash del WIP al arrancar / restaura al parar (ATERRIZAJE-4)

  // Se espera a saber si hay key para no parpadear el onboarding al arrancar.
  if (apiKeyChecked && !hasApiKey && !onboardingDismissed) {
    return <OnboardingScreen onSkip={dismissOnboarding} />
  }

  return (
    <>
      <AppShell
        onSend={gate.send}
        plan={
          gate.pendingPrompt === null ? null : (
            <WorkflowPlanCard
              prompt={gate.pendingPrompt}
              onCancel={gate.cancel}
              onApprove={gate.approve}
            />
          )
        }
      />
      <ProjectDialogs />
      <Toaster />
      {healthPanelOpen ? <HealthPanel /> : null}
      {openAgentId ? (
        <AgentDetailModal agentId={openAgentId} onClose={() => setOpenAgent(null)} />
      ) : null}
      {openCapabilityId ? (
        <CapabilityModal capabilityId={openCapabilityId} onClose={() => setOpenCapability(null)} />
      ) : null}
    </>
  )
}
