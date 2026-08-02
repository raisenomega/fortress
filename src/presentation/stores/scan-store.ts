import { create } from 'zustand'
import type { ScanSummary } from '@application/scan/scan-types'
import type { Finding } from '@domain/project/project'
import { EMPTY_COUNTS, type SeverityCounts } from '@domain/project/severity-counts'

interface ScanState {
  /** Conteos de todos los proyectos, para pintar las tarjetas sin releer nada. */
  readonly counts: Readonly<Record<string, SeverityCounts>>
  readonly byProject: Readonly<Record<string, readonly Finding[]>>
  /** Solo se escanea un proyecto a la vez: cada scan es un proceso pesado. */
  readonly runningProjectId: string | null
  readonly progress: string
  readonly error: string | null
  readonly lastSummary: ScanSummary | null
  setCounts: (counts: Readonly<Record<string, SeverityCounts>>) => void
  setFindings: (projectId: string, findings: readonly Finding[]) => void
  startScan: (projectId: string) => void
  appendProgress: (delta: string) => void
  finishScan: (summary: ScanSummary | null, error: string | null) => void
}

export const useScanStore = create<ScanState>((set) => ({
  counts: {},
  byProject: {},
  runningProjectId: null,
  progress: '',
  error: null,
  lastSummary: null,

  setCounts: (counts) => set({ counts }),

  setFindings: (projectId, findings) =>
    set((state) => ({ byProject: { ...state.byProject, [projectId]: findings } })),

  startScan: (projectId) =>
    set({ runningProjectId: projectId, progress: '', error: null, lastSummary: null }),

  appendProgress: (delta) => set((state) => ({ progress: state.progress + delta })),

  finishScan: (lastSummary, error) => set({ runningProjectId: null, lastSummary, error })
}))

/**
 * Referencias estables para lo vacio. Devolver un objeto nuevo en cada render
 * haria que zustand viera siempre un snapshot distinto y React entraria en un
 * bucle infinito de actualizacion.
 */
const NO_FINDINGS: readonly Finding[] = []

export function useProjectFindings(projectId: string | null): readonly Finding[] {
  return useScanStore((state) =>
    projectId ? (state.byProject[projectId] ?? NO_FINDINGS) : NO_FINDINGS
  )
}

export function useProjectCounts(projectId: string | null): SeverityCounts {
  return useScanStore((state) =>
    projectId ? (state.counts[projectId] ?? EMPTY_COUNTS) : EMPTY_COUNTS
  )
}
