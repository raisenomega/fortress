import { create } from 'zustand'
import { UNKNOWN_BILLING, type Billing } from '@domain/telemetry/billing-mode'
import { NADA_SIN_MEDIR, type SinFactura } from '@domain/telemetry/sin-factura'
import { EMPTY_USAGE, type TokenUsage } from '@domain/telemetry/token-usage'

interface TelemetryState {
  /** Consumo desde que arranco la app. */
  readonly session: TokenUsage
  /** Lo que el `session` de arriba NO pudo contar. Aparte y no sumado: si
   *  viviera dentro del consumo, alguien acabaria sumandolo. */
  readonly sinMedir: SinFactura
  readonly billing: Billing
  setSession: (session: TokenUsage, sinMedir: SinFactura) => void
  setBilling: (billing: Billing) => void
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  session: EMPTY_USAGE,
  sinMedir: NADA_SIN_MEDIR,
  billing: UNKNOWN_BILLING,
  setSession: (session, sinMedir) => set({ session, sinMedir }),
  setBilling: (billing) => set({ billing })
}))
