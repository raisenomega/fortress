import { create } from 'zustand'
import { EMPTY_USAGE, type TokenUsage } from '@domain/telemetry/token-usage'

interface TelemetryState {
  /** Consumo desde que arranco la app. */
  readonly session: TokenUsage
  setSession: (session: TokenUsage) => void
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  session: EMPTY_USAGE,
  setSession: (session) => set({ session })
}))
