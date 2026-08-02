import { create } from 'zustand'
import { DEFAULT_OPERATION_MODE, type OperationMode } from '@domain/settings/operation-mode'

interface SettingsState {
  readonly mode: OperationMode
  readonly hasApiKey: boolean
  setMode: (mode: OperationMode) => void
  setHasApiKey: (hasApiKey: boolean) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  mode: DEFAULT_OPERATION_MODE,
  hasApiKey: false,

  setMode: (mode) => set({ mode }),
  setHasApiKey: (hasApiKey) => set({ hasApiKey })
}))
