import type { OmegaGateVerdict } from './capability-gate'
import type { CapabilityKind, CapabilityPhase, Promotion } from './capability'
import { phaseFor, requiresHumanApproval } from './capability-lifecycle'

const ORDER: readonly CapabilityPhase[] = ['propuesta', 'prueba', 'ciclo', 'oficial']

/** La fase inmediatamente superior a la aprobada, o null si ya es oficial. */
export function nextPhase(approved: CapabilityPhase): CapabilityPhase | null {
  const i = ORDER.indexOf(approved)
  return i >= 0 && i < ORDER.length - 1 ? ORDER[i + 1] : null
}

/**
 * A que fase puede saltar una capacidad y que la frena. Puro y derivado: se
 * calcula del historial (episodios), del tipo (agente exige humano) y del
 * veredicto de OMEGA. NO decide: describe. Quien decide es canPromote.
 */
export function evaluatePromotion(
  kind: CapabilityKind,
  approved: CapabilityPhase,
  episodes: number,
  omegaVeto: OmegaGateVerdict
): Promotion {
  const to = nextPhase(approved)
  const reached = to !== null && ORDER.indexOf(phaseFor(episodes)) >= ORDER.indexOf(to)
  return {
    eligible: reached,
    to,
    needsHuman: requiresHumanApproval(kind),
    blocked: omegaVeto.vetoed
  }
}

/**
 * Decision final del salto. OMEGA es testigo-no-actor: si veto (blocked), no hay
 * salto. Un agente nuevo exige aprobacion humana; lo reversible no. Sin episodios
 * suficientes (no eligible), tampoco.
 */
export function canPromote(promotion: Promotion, humanApproved: boolean): boolean {
  if (!promotion.eligible || promotion.blocked) return false
  return promotion.needsHuman ? humanApproved : true
}
