import { create } from 'zustand'
import type { AgentId } from '@domain/agent/agent'

export type MainView = 'chat' | 'scan' | 'actividad' | 'cognition' | 'rendimiento' | 'settings'

interface UiState {
  readonly view: MainView
  readonly addProjectOpen: boolean
  /** Agente cuyo detalle esta abierto, o null. */
  readonly openAgentId: AgentId | null
  /** El aviso de modo autonomo se cerro en esta activacion. */
  readonly autonomousNoticeHidden: boolean
  /** Permite entrar a la app sin configurar la key todavia. */
  readonly onboardingDismissed: boolean
  setView: (view: MainView) => void
  setAddProjectOpen: (open: boolean) => void
  setOpenAgent: (id: AgentId | null) => void
  hideAutonomousNotice: () => void
  showAutonomousNotice: () => void
  dismissOnboarding: () => void
}

export const useUiStore = create<UiState>((set) => ({
  view: 'chat',
  addProjectOpen: false,
  openAgentId: null,
  autonomousNoticeHidden: false,
  onboardingDismissed: false,

  setView: (view) => set({ view }),
  setAddProjectOpen: (addProjectOpen) => set({ addProjectOpen }),
  setOpenAgent: (openAgentId) => set({ openAgentId }),
  hideAutonomousNotice: () => set({ autonomousNoticeHidden: true }),
  showAutonomousNotice: () => set({ autonomousNoticeHidden: false }),
  dismissOnboarding: () => set({ onboardingDismissed: true })
}))
