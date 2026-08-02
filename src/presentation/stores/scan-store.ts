import { create } from 'zustand'
import type { ScanSummary } from '@application/scan/scan-types'
import type { Finding } from '@domain/project/project'
import type { SeverityCounts } from '@domain/project/severity-counts'

interface ScanError {
  readonly projectId: string
  readonly message: string
}

interface ScanState {
  /** Conteos de todos los proyectos, para pintar las tarjetas sin releer nada. */
  readonly counts: Readonly<Record<string, SeverityCounts>>
  readonly byProject: Readonly<Record<string, readonly Finding[]>>
  /** Solo se escanea un proyecto a la vez: cada scan es un proceso pesado. */
  readonly runningProjectId: string | null
  readonly progress: string
  readonly lastError: ScanError | null
  readonly lastSummary: ScanSummary | null
  setCounts: (counts: Readonly<Record<string, SeverityCounts>>) => void
  setFindings: (projectId: string, findings: readonly Finding[]) => void
  startScan: (projectId: string) => void
  appendProgress: (delta: string) => void
  finishScan: (projectId: string, summary: ScanSummary | null, error: string | null) => void
}

export const useScanStore = create<ScanState>((set) => ({
  counts: {},
  byProject: {},
  runningProjectId: null,
  progress: '',
  lastError: null,
  lastSummary: null,

  setCounts: (counts) => set({ counts }),

  setFindings: (projectId, findings) =>
    set((state) => ({ byProject: { ...state.byProject, [projectId]: findings } })),

  startScan: (projectId) =>
    set({ runningProjectId: projectId, progress: '', lastError: null, lastSummary: null }),

  appendProgress: (delta) => set((state) => ({ progress: state.progress + delta })),

  finishScan: (projectId, lastSummary, error) =>
    set({
      runningProjectId: null,
      lastSummary,
      lastError: error === null ? null : { projectId, message: error }
    })
}))
