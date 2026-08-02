import { create } from 'zustand'
import type { ScanRecord } from '@domain/scan/scan-record'
import type { AgentRanking } from '@domain/telemetry/agent-run'
import { EMPTY_USAGE, type TokenUsage } from '@domain/telemetry/token-usage'
import type { TimeWindow } from '@domain/telemetry/time-window'

interface PerformanceState {
  readonly window: TimeWindow
  readonly usage: TokenUsage
  readonly byProject: Readonly<Record<string, TokenUsage>>
  readonly ranking: readonly AgentRanking[]
  readonly scans: readonly ScanRecord[]
  readonly loading: boolean
  setWindow: (window: TimeWindow) => void
  setData: (
    data: Omit<PerformanceState, 'window' | 'loading' | 'setWindow' | 'setData' | 'setLoading'>
  ) => void
  setLoading: (loading: boolean) => void
}

export const usePerformanceStore = create<PerformanceState>((set) => ({
  window: 'semana',
  usage: EMPTY_USAGE,
  byProject: {},
  ranking: [],
  scans: [],
  loading: false,
  setWindow: (window) => set({ window }),
  setData: (data) => set({ ...data, loading: false }),
  setLoading: (loading) => set({ loading })
}))
