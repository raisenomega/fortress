import { create } from 'zustand'
import type { AgentId } from '@domain/agent/agent'

export type MainView =
  | 'chat'
  | 'scan'
  | 'actividad'
  | 'cognition'
  | 'exposicion'
  | 'rendimiento'
  | 'settings'
  | 'conectores'
  | 'omega'
  | 'sistema'
  | 'genesis'
  | 'construir'
  | 'docs'

interface UiState {
  readonly view: MainView
  /** null cerrado, 'chooser' eligiendo, 'connect' conectando, 'create' creando. */
  readonly projectDialog: 'chooser' | 'connect' | 'create' | null
  /** Agente cuyo detalle esta abierto, o null. */
  readonly openAgentId: AgentId | null
  /** Capacidad cuyo detalle esta abierto, o null. */
  readonly openCapabilityId: string | null
  /** El aviso de modo autonomo se cerro en esta activacion. */
  readonly autonomousNoticeHidden: boolean
  /** Permite entrar a la app sin configurar la key todavia. */
  readonly onboardingDismissed: boolean
  /** Mantener la pantalla encendida mientras los agentes trabajan. */
  readonly keepAwake: boolean
  setView: (view: MainView) => void
  setProjectDialog: (dialog: 'chooser' | 'connect' | 'create' | null) => void
  setOpenAgent: (id: AgentId | null) => void
  setOpenCapability: (id: string | null) => void
  hideAutonomousNotice: () => void
  showAutonomousNotice: () => void
  dismissOnboarding: () => void
  setKeepAwake: (on: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  view: 'chat',
  projectDialog: null,
  openAgentId: null,
  openCapabilityId: null,
  autonomousNoticeHidden: false,
  onboardingDismissed: false,
  keepAwake: false,

  setView: (view) => set({ view }),
  setProjectDialog: (projectDialog) => set({ projectDialog }),
  setOpenAgent: (openAgentId) => set({ openAgentId }),
  setOpenCapability: (openCapabilityId) => set({ openCapabilityId }),
  hideAutonomousNotice: () => set({ autonomousNoticeHidden: true }),
  showAutonomousNotice: () => set({ autonomousNoticeHidden: false }),
  dismissOnboarding: () => set({ onboardingDismissed: true }),
  setKeepAwake: (keepAwake) => set({ keepAwake })
}))
