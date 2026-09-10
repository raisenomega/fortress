import { create } from 'zustand'
import type { ScanSummary } from '@application/scan/scan-types'
import type { Finding } from '@domain/project/project'
import type { ParadaEnCurso } from '@domain/scan/scan-chunk'
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
  /** En que parada va el recorrido, o null si no lo dice (escaneo de una pieza,
   *  o todavia sin terminar la primera). La UI que lo pinta es otra pieza. */
  readonly parada: ParadaEnCurso | null
  readonly lastError: ScanError | null
  readonly lastSummary: ScanSummary | null
  setCounts: (counts: Readonly<Record<string, SeverityCounts>>) => void
  setFindings: (projectId: string, findings: readonly Finding[]) => void
  startScan: (projectId: string) => void
  appendProgress: (delta: string) => void
  setParada: (parada: ParadaEnCurso) => void
  finishScan: (projectId: string, summary: ScanSummary | null, error: string | null) => void
}

export const useScanStore = create<ScanState>((set) => ({
  counts: {},
  byProject: {},
  runningProjectId: null,
  progress: '',
  parada: null,
  lastError: null,
  lastSummary: null,

  setCounts: (counts) => set({ counts }),

  setFindings: (projectId, findings) =>
    set((state) => ({ byProject: { ...state.byProject, [projectId]: findings } })),

  startScan: (projectId) =>
    set({ runningProjectId: projectId, progress: '', parada: null, lastError: null, lastSummary: null }), // prettier-ignore

  appendProgress: (delta) => set((state) => ({ progress: state.progress + delta })),

  setParada: (parada) => set({ parada }),

  finishScan: (projectId, lastSummary, error) =>
    set({
      runningProjectId: null,
      lastSummary,
      lastError: error === null ? null : { projectId, message: error }
    })
}))
