import { create } from 'zustand'

export type MainView = 'chat' | 'scan' | 'cognition' | 'settings'

interface UiState {
  readonly view: MainView
  readonly addProjectOpen: boolean
  /** Permite entrar a la app sin configurar la key todavia. */
  readonly onboardingDismissed: boolean
  setView: (view: MainView) => void
  setAddProjectOpen: (open: boolean) => void
  dismissOnboarding: () => void
}

export const useUiStore = create<UiState>((set) => ({
  view: 'chat',
  addProjectOpen: false,
  onboardingDismissed: false,

  setView: (view) => set({ view }),
  setAddProjectOpen: (addProjectOpen) => set({ addProjectOpen }),
  dismissOnboarding: () => set({ onboardingDismissed: true })
}))
