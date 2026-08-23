import type { Proposal } from './proposal'
import { isRetryable } from './retry-eligibility'

/**
 * Intentos con la MISMA causa sobre el MISMO arbol que se toleran. Uno puede
 * ser mala suerte —el generador divago esa vez— y por eso el primero se
 * reintenta. Al segundo ya no es suerte: es que el fix correcto no cabe donde
 * se le pide que quepa, y repetirlo solo cuesta otro analisis y otra
 * generacion. Cuatro intentos del mismo hallazgo, ocho dolares, ningun fix.
 */
const INTENTOS_POR_CAUSA = 2

/** Cuantas de sus propuestas murieron por lo mismo y sobre la misma base. */
function repetidos(suyas: readonly Proposal[], ultima: Proposal): number {
  const causa = (ultima.analysisReason ?? '').split(':')[0]
  return suyas.filter(
    (p) =>
      p.state === 'RECHAZADO' &&
      p.baseSha === ultima.baseSha &&
      (p.analysisReason ?? '').startsWith(causa)
  ).length
}

/**
 * El rechazo previo que BLOQUEA volver a elegir el hallazgo. Dos casos, y en
 * los dos el arbol tiene que seguir quieto: si el HEAD avanzo —alguien
 * commitea, o el motor integra— el hallazgo vuelve solo a la baraja, porque ahi
 * si hay algo distinto que intentar. Es una PAUSA, nunca una extincion: el
 * hallazgo sigue vivo y contando en el expediente.
 *
 * 1. La causa no se arregla repitiendo (presupuesto, worktree, timeouts).
 * 2. La causa SI era reintentable, pero ya se reintento y murio igual. El
 *    reintento existe para el fallo de una vez; sostenerlo contra un fix que
 *    no cabe en la correa es pagar dos veces por el mismo no.
 */
export function hasBlockingRejection(
  findingId: string,
  headSha: string,
  proposals: readonly Proposal[]
): boolean {
  const suyas = proposals.filter((p) => p.findingId === findingId)
  if (suyas.length === 0) return false

  const ultima = suyas.reduce((vieja, otra) => (otra.createdAt > vieja.createdAt ? otra : vieja))
  if (ultima.state !== 'RECHAZADO' || ultima.baseSha !== headSha) return false
  if (!isRetryable(ultima.state, ultima.analysisReason ?? null)) return true
  return repetidos(suyas, ultima) >= INTENTOS_POR_CAUSA
}
