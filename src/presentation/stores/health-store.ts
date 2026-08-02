import { create } from 'zustand'
import type { HealthReport } from '@domain/health/health-check'

interface HealthState {
  readonly report: HealthReport | null
  readonly running: boolean
  readonly panelOpen: boolean
  setReport: (report: HealthReport) => void
  setRunning: (running: boolean) => void
  setPanelOpen: (panelOpen: boolean) => void
}

export const useHealthStore = create<HealthState>((set) => ({
  report: null,
  running: false,
  panelOpen: false,

  setReport: (report) => set({ report }),
  setRunning: (running) => set({ running }),
  setPanelOpen: (panelOpen) => set({ panelOpen })
}))
