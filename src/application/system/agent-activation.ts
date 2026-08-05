import { draftConcerns, MAX_ACTIVE_CAPABILITIES } from '@domain/system/agent-draft'
import type { StoredAgentDraft } from '@domain/system/agent-draft-repository'
import { requiresHumanApproval } from '@domain/system/capability-lifecycle'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/**
 * Activa un agente auto-propuesto: su definicion se inyecta en el despacho.
 * Frenos: firma humana (agente), OMEGA sin concerns de contenido y techo de
 * activos. OMEGA veta con evidencia (la frase); nunca aprueba por si mismo.
 */
export function activateAgent(
  context: AppContext,
  capabilityId: string,
  humanApproved: boolean
): Result<StoredAgentDraft> {
  const capability = context.capabilities.findById(capabilityId)
  if (!capability) return err('Esa capacidad ya no existe')
  const draft = context.agentDrafts.get(capabilityId)
  if (!draft) return err('No hay borrador que activar')
  if (requiresHumanApproval(capability.kind) && !humanApproved) {
    return err('Un agente nuevo exige aprobacion humana')
  }
  const concerns = draftConcerns(draft)
  if (concerns.length > 0) return err(`OMEGA veta el borrador: ${concerns.join(', ')}`)
  if (!draft.active && context.agentDrafts.countActive() >= MAX_ACTIVE_CAPABILITIES) {
    return err(`Techo alcanzado: maximo ${MAX_ACTIVE_CAPABILITIES} activos`)
  }
  context.agentDrafts.setActive(capabilityId, true)
  return ok({ ...draft, active: true })
}

/** Desactiva un agente: deja de inyectarse. Reversion instantanea. */
export function deactivateAgent(context: AppContext, capabilityId: string): Result<void> {
  if (!context.agentDrafts.get(capabilityId)) return err('No hay borrador')
  context.agentDrafts.setActive(capabilityId, false)
  return ok(undefined)
}
