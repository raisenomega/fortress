import type { Capability, StoredCapability } from '@domain/system/capability'
import { canPromote } from '@domain/system/capability-promotion'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { liveCapability } from './describe-capabilities'

/** Por que un salto no procede, en palabras, para devolverlo al operador. */
function whyBlocked(live: Capability): string {
  if (live.promotion.blocked) return live.omegaVeto.reason ?? 'OMEGA veta la promocion'
  if (!live.promotion.eligible) {
    return live.promotion.to === null ? 'Ya es oficial' : 'Aun no hay episodios suficientes'
  }
  return 'Un agente nuevo exige aprobacion humana'
}

/**
 * Salta una capacidad a la fase superior si su promocion esta autorizada: OMEGA
 * no la veta, hay episodios suficientes y —si es un agente nuevo— un humano lo
 * aprobo. OMEGA solo frena; el visto bueno lo da el gate por riesgo. Persiste la
 * fase aprobada y devuelve la vista viva ya actualizada.
 */
export function promoteCapability(
  context: AppContext,
  id: string,
  humanApproved: boolean
): Result<Capability> {
  const stored = context.capabilities.findById(id)
  if (!stored) return err('Esa capacidad ya no existe')
  const live = liveCapability(stored, context.runs)
  const to = live.promotion.to
  if (to === null || !canPromote(live.promotion, humanApproved)) return err(whyBlocked(live))
  context.capabilities.promote(id, to)
  const updated = context.capabilities.findById(id) as StoredCapability
  return ok(liveCapability(updated, context.runs))
}
