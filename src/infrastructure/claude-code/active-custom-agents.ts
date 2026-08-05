import type { AgentDefinition } from '@domain/agent/agent-prompt'
import type { StoredAgentDraft } from '@domain/system/agent-draft-repository'

/**
 * Convierte los borradores ACTIVOS en el payload que espera `--agents`, clavado
 * por capabilityId (unico) para no chocar jamas con los agentes integrados.
 * Son datos: un prompt con su descripcion, nada de codigo.
 */
export function activeCustomAgents(
  drafts: readonly StoredAgentDraft[]
): Readonly<Record<string, AgentDefinition>> {
  const payload: Record<string, AgentDefinition> = {}
  for (const draft of drafts) {
    payload[draft.capabilityId] = { description: draft.name, prompt: draft.prompt }
  }
  return payload
}
