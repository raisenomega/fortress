import type { Proposal, ProposalState } from './proposal'

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

/**
 * El rechazo previo que BLOQUEA volver a elegir el hallazgo: su ultima
 * propuesta murio por una causa que repetir no arregla —las de arriba— y el
 * arbol no se ha movido desde entonces, porque la base de aquel intento sigue
 * siendo el HEAD de hoy. Volver a elegirlo produciria el mismo fix, para que
 * muriera igual, cobrando lo mismo.
 *
 * En cuanto el HEAD avanza —alguien commitea, o el motor integra— el hallazgo
 * vuelve solo a la baraja: ahi si hay algo distinto que intentar. Y un rechazo
 * reintentable no bloquea nunca: para eso esta el reintento.
 */
export function hasBlockingRejection(
  findingId: string,
  headSha: string,
  proposals: readonly Proposal[]
): boolean {
  const suyas = proposals.filter((p) => p.findingId === findingId)
  if (suyas.length === 0) return false

  const ultima = suyas.reduce((vieja, otra) => (otra.createdAt > vieja.createdAt ? otra : vieja))
  if (ultima.state !== 'RECHAZADO') return false
  if (isRetryable(ultima.state, ultima.analysisReason ?? null)) return false
  return ultima.baseSha === headSha
}
