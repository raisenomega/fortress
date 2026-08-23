import type { ProposalState } from './proposal'

/**
 * D24 — solo los rechazos de RAZONAMIENTO del motor merecen reintento: OMEGA
 * veto, el generador se salio de correa, no produjo diff o fallo. Los fallos
 * TECNICOS (presupuesto, techo de turnos, timeouts, worktree perdido/sucio, npm
 * ci) no: repetir sin arreglar la causa daria lo mismo.
 *
 * El analisis ilegible entra por el criterio, no por la categoria: lo que no se
 * dejo leer fue la respuesta de un modelo, que no es la misma dos veces, asi
 * que repetir SI puede dar otra cosa. El tope de dos intentos por causa hace el
 * resto: uno mas, y si vuelve a salir ilegible se queda en pausa VISTO COMO
 * TAL, nunca como hallazgo obsoleto.
 */
export const RETRYABLE_REJECTION_REASONS = [
  'omega_vetado',
  'scope_violation',
  'no_diff_produced',
  'generator_error',
  'analisis_ilegible'
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
