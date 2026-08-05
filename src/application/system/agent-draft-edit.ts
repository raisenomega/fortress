import type { AgentDraft } from '@domain/system/agent-draft'
import type { StoredAgentDraft } from '@domain/system/agent-draft-repository'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/** Guarda (o reemplaza) el borrador de un agente auto-propuesto. Solo dato. */
export function setAgentDraft(
  context: AppContext,
  capabilityId: string,
  draft: AgentDraft
): Result<StoredAgentDraft> {
  const capability = context.capabilities.findById(capabilityId)
  if (!capability) return err('Esa capacidad ya no existe')
  if (capability.kind !== 'agente') return err('Solo un agente lleva definicion')
  if (draft.name.trim().length === 0 || draft.prompt.trim().length === 0) {
    return err('El borrador necesita nombre y prompt')
  }
  return ok(
    context.agentDrafts.set(capabilityId, {
      name: draft.name.trim().slice(0, 80),
      prompt: draft.prompt.trim().slice(0, 4000),
      iconName: draft.iconName
    })
  )
}

/** El borrador de una capacidad, o null. */
export function getAgentDraft(context: AppContext, capabilityId: string): StoredAgentDraft | null {
  return context.agentDrafts.get(capabilityId)
}
