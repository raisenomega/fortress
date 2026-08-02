import { create } from 'zustand'
import { UNKNOWN_BILLING, type Billing } from '@domain/telemetry/billing-mode'
import { EMPTY_USAGE, type TokenUsage } from '@domain/telemetry/token-usage'

interface TelemetryState {
  /** Consumo desde que arranco la app. */
  readonly session: TokenUsage
  readonly billing: Billing
  setSession: (session: TokenUsage) => void
  setBilling: (billing: Billing) => void
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  session: EMPTY_USAGE,
  billing: UNKNOWN_BILLING,
  setSession: (session) => set({ session }),
  setBilling: (billing) => set({ billing })
}))
