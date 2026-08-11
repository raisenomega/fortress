import type { ProposalState } from './proposal'

/**
 * D24 — solo los rechazos de RAZONAMIENTO del motor merecen reintento: OMEGA
 * veto, el generador se salio de correa, no produjo diff o fallo. Los fallos
 * TECNICOS (presupuesto, timeouts, worktree perdido/sucio, npm ci) no: repetir
 * sin arreglar la causa daria lo mismo.
 */
export const RETRYABLE_REJECTION_REASONS = [
  'omega_vetado',
  'scope_violation',
  'no_diff_produced',
  'generator_error'
] as const

/**
 * La razon se persiste a veces con sufijo ("omega_vetado: <razon>",
 * "gate_failed_at=lint"), por eso se matchea por PREFIJO exacto de palabra.
 */
export function isRetryable(
  state: ProposalState,
  rejectionReason: string | null | undefined
): boolean {
  if (state !== 'RECHAZADO' || rejectionReason == null) return false
  return RETRYABLE_REJECTION_REASONS.some(
    (reason) => rejectionReason === reason || rejectionReason.startsWith(`${reason}:`)
  )
}
