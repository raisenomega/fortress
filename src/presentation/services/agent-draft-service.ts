import type { AgentDraft } from '@domain/system/agent-draft'
import type { StoredAgentDraft } from '@domain/system/agent-draft-repository'
import type { Result } from '@domain/shared/result'
import { api } from '../adapters/fortress-api'
import { loadCapabilities } from './self-improvement-service'

/** Borrador de la definicion de un agente auto-propuesto (dato, no codigo). */
export async function loadAgentDraft(id: string): Promise<StoredAgentDraft | null> {
  return api().system.agentDraft(id)
}

export async function saveAgentDraft(
  id: string,
  draft: AgentDraft
): Promise<Result<StoredAgentDraft>> {
  return api().system.setAgentDraft(id, draft)
}

/** Activa/desactiva la inyeccion del agente y refresca las capacidades. */
export async function activateAgent(id: string, human: boolean): Promise<Result<StoredAgentDraft>> {
  const result = await api().system.activateAgent(id, human)
  await loadCapabilities()
  return result
}

export async function deactivateAgent(id: string): Promise<Result<void>> {
  const result = await api().system.deactivateAgent(id)
  await loadCapabilities()
  return result
}

/** Un agente redacta el borrador solo (corrida real). Sigue inerte hasta activar. */
export async function draftAgentAuto(id: string): Promise<Result<StoredAgentDraft>> {
  return api().system.draftAgentAuto(id)
}
