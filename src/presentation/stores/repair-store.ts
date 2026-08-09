import { create } from 'zustand'
import type { Finding } from '@domain/project/project'
import type { Proposal } from '@domain/repair/proposal'

interface RepairState {
  /** El proyecto que ES el propio repo (debut del motor); null si no esta registrado. */
  readonly projectId: string | null
  readonly proposals: readonly Proposal[]
  readonly findings: readonly Finding[]
  readonly busy: boolean
  setProject: (id: string | null) => void
  setData: (proposals: readonly Proposal[], findings: readonly Finding[]) => void
  setBusy: (busy: boolean) => void
}

export const useRepairStore = create<RepairState>((set) => ({
  projectId: null,
  proposals: [],
  findings: [],
  busy: false,
  setProject: (projectId) => set({ projectId }),
  setData: (proposals, findings) => set({ proposals, findings }),
  setBusy: (busy) => set({ busy })
}))
