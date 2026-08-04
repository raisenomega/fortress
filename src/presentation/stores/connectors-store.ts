import { create } from 'zustand'
import type { ConnectorCategory, ConnectorState } from '@domain/connectors/connector'

export interface ConnectorDraft {
  readonly name: string
  readonly url: string
  readonly description: string
  readonly category: ConnectorCategory
}

const EMPTY_DRAFT: ConnectorDraft = {
  name: '',
  url: '',
  description: '',
  category: 'desarrollo'
}

interface ConnectorsState {
  readonly items: readonly ConnectorState[]
  readonly error: string | null
  readonly saving: boolean
  readonly draft: ConnectorDraft
  setItems: (items: readonly ConnectorState[]) => void
  setError: (error: string | null) => void
  setSaving: (saving: boolean) => void
  patchDraft: (patch: Partial<ConnectorDraft>) => void
  resetDraft: () => void
}

export const useConnectorsStore = create<ConnectorsState>((set) => ({
  items: [],
  error: null,
  saving: false,
  draft: EMPTY_DRAFT,

  setItems: (items) => set({ items }),
  setError: (error) => set({ error }),
  setSaving: (saving) => set({ saving }),
  patchDraft: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),
  resetDraft: () => set({ draft: EMPTY_DRAFT })
}))
