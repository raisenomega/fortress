import { create } from 'zustand'
import { DEFAULT_OPERATION_MODE, type OperationMode } from '@domain/settings/operation-mode'

interface SettingsState {
  readonly mode: OperationMode
  readonly hasApiKey: boolean
  /** Hasta que no se consulta, no se sabe: evita parpadear el onboarding. */
  readonly apiKeyChecked: boolean
  setMode: (mode: OperationMode) => void
  setHasApiKey: (hasApiKey: boolean) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  mode: DEFAULT_OPERATION_MODE,
  hasApiKey: false,
  apiKeyChecked: false,

  setMode: (mode) => set({ mode }),
  setHasApiKey: (hasApiKey) => set({ hasApiKey, apiKeyChecked: true })
}))
