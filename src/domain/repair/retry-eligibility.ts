import type { ProposalState } from './proposal'

/**
 * D24 — solo los rechazos de RAZONAMIENTO del motor merecen reintento: OMEGA
 * veto, el generador se salio de correa o no produjo diff. Los fallos TECNICOS
 * (presupuesto, techo de turnos, timeouts, worktree perdido/sucio, npm ci) no:
 * repetir sin arreglar la causa daria lo mismo.
 *
 * `provider_error` SI entra, y no rompe la regla: un 429 o un corte de red no
 * son un fallo del fix y la vez siguiente puede ir bien. Antes entraba
 * `generator_error`, que ademas de eso cubria nuestro propio reloj — o sea que
 * la lista contradecia al parrafo de arriba, que nombra los timeouts. Partir el
 * estado es lo que las reconcilia.
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
  'provider_error',
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
