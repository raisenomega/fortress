/** Por que una propuesta NO llego a GENERADO. La razon viaja en analysis_reason. */
export const REJECTION_REASONS = [
  'scope_violation',
  'budget_exceeded',
  'generator_error',
  'no_diff_produced',
  'worktree_contaminated',
  'orphan_before_generate',
  'superseded',
  'gate_failed',
  'gate_timeout',
  'npm_ci_failed',
  /** El proyecto no declara ningun script con el que verificar el fix. */
  'gate_sin_verificacion',
  'worktree_missing',
  'omega_vetado',
  'omega_timeout',
  'omega_error',
  'omega_response_invalid'
] as const

export type RejectionReason = (typeof REJECTION_REASONS)[number]

export function isRejectionReason(value: string): value is RejectionReason {
  return (REJECTION_REASONS as readonly string[]).includes(value)
}
