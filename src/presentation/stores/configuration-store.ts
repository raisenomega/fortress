import { create } from 'zustand'

interface ConfigurationState {
  /** Ultimo borrador capturado por proyecto -> por archivo. */
  readonly drafts: Record<string, Record<string, string>>
  /** Documentos aprobados por proyecto (indice en DRAFTED_DOCS). */
  readonly approved: Record<string, number>
  readonly executing: Record<string, boolean>
  mergeDrafts: (projectId: string, blocks: Map<string, string>) => void
  approve: (projectId: string) => void
  restart: (projectId: string) => void
  setExecuting: (projectId: string, on: boolean) => void
  clear: (projectId: string) => void
}

export const useConfigurationStore = create<ConfigurationState>((set) => ({
  drafts: {},
  approved: {},
  executing: {},
  mergeDrafts: (projectId, blocks) =>
    set((s) => ({
      drafts: {
        ...s.drafts,
        [projectId]: { ...s.drafts[projectId], ...Object.fromEntries(blocks) }
      }
    })),
  approve: (projectId) =>
    set((s) => ({ approved: { ...s.approved, [projectId]: (s.approved[projectId] ?? 0) + 1 } })),
  restart: (projectId) =>
    set((s) => ({
      approved: { ...s.approved, [projectId]: 0 },
      drafts: { ...s.drafts, [projectId]: {} }
    })),
  setExecuting: (projectId, on) => set((s) => ({ executing: { ...s.executing, [projectId]: on } })),
  clear: (projectId) =>
    set((s) => ({
      drafts: { ...s.drafts, [projectId]: {} },
      approved: { ...s.approved, [projectId]: 0 }
    }))
}))
