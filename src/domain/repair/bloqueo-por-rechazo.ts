import type { Proposal } from './proposal'
import { huellaDelMotivo } from './motivo-del-arreglo'
import { isRetryable } from './retry-eligibility'

/**
 * Intentos sobre el MISMO arbol que se toleran por cuenta. Uno puede ser mala
 * suerte —el generador divago esa vez— y por eso el primero se reintenta. Al
 * segundo ya no es suerte: es que el fix correcto no cabe donde se le pide que
 * quepa, y repetirlo solo cuesta otro analisis y otra generacion.
 */
const INTENTOS_POR_CAUSA = 2

/** ADR-115 B1: las causas que hablan del ARREGLO comparten una sola cuenta por
 *  hallazgo y base: alternarlas (veto, sin diff, veto) ya no compra un tercero.
 *  Las averias (`provider_error`, `analisis_ilegible`) cuentan cada una aparte:
 *  un 429 no dice nada del fix y no le gasta el presupuesto. */
const RAZONAMIENTO: readonly string[] = ['omega_vetado', 'scope_violation', 'no_diff_produced', 'solo_pruebas'] // prettier-ignore
const causaDe = (p: Proposal): string => (p.analysisReason ?? '').split(':')[0]

/** Cuantas de sus propuestas cayeron en la MISMA cuenta y sobre la misma base. */
function repetidos(suyas: readonly Proposal[], ultima: Proposal): number {
  const causa = causaDe(ultima)
  const cuenta = (c: string): boolean => (RAZONAMIENTO.includes(causa) ? RAZONAMIENTO.includes(c) : c === causa) // prettier-ignore
  return suyas.filter(
    (p) => p.state === 'RECHAZADO' && p.baseSha === ultima.baseSha && cuenta(causaDe(p))
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
 * 3. El arreglo no cabia en la correa (ADR-102 §4): a esta la levanta el
 *    TERRENO, no el HEAD. El arbol de FORTRESS cambia a diario y la correa no;
 *    mientras `.fortress/config` tenga la misma huella, volver a elegirlo es
 *    pagar otro analisis por el mismo no (24 $ de 49 en un solo ancla).
 */
export function hasBlockingRejection(
  findingId: string,
  headSha: string,
  proposals: readonly Proposal[],
  huella: string
): boolean {
  const suyas = proposals.filter((p) => p.findingId === findingId)
  if (suyas.length === 0) return false

  const ultima = suyas.reduce((vieja, otra) => (otra.createdAt > vieja.createdAt ? otra : vieja))
  if (ultima.state !== 'RECHAZADO') return false
  const cfg = huellaDelMotivo(ultima.analysisReason)
  if (cfg !== null) return cfg === huella
  if (ultima.baseSha !== headSha) return false
  if (!isRetryable(ultima.state, ultima.analysisReason ?? null)) return true
  return repetidos(suyas, ultima) >= INTENTOS_POR_CAUSA
}
