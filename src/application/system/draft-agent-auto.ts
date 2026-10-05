import type { CodeAgent } from '@domain/chat/code-agent'
import type { StoredAgentDraft } from '@domain/system/agent-draft-repository'
import { buildDraftPrompt, parseAgentDraft } from '@domain/system/agent-draft-prompt'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { MODELO_POR_ROL } from '@domain/agent/modelo-por-rol'

/**
 * Autonomia real, ACOTADA a un disparo: un AGENTE redacta la definicion de la
 * capacidad y la deja como BORRADOR inerte. No activa nada — el humano sigue
 * firmando y OMEGA sigue auditando. Corre en un sandbox y en 'lectura' (no
 * edita, sin Bash, y ve el grafo: en 'plan' el MCP entero quedaba bloqueado).
 * El agente se inyecta: la logica es testeable; la corrida real la lanza el IPC.
 */
export async function draftAgentAuto(
  context: AppContext,
  capabilityId: string,
  agent: CodeAgent,
  sandboxPath: string
): Promise<Result<StoredAgentDraft>> {
  const capability = context.capabilities.findById(capabilityId)
  if (!capability) return err('Esa capacidad ya no existe')
  if (capability.kind !== 'agente') return err('Solo un agente lleva definicion')
  const prompt = buildDraftPrompt(capability.name, capability.originObservation)
  const reply = await agent.run(
    { projectPath: sandboxPath, prompt, permissionMode: 'lectura', agentId: null, model: MODELO_POR_ROL.borrador, trusted: false },
    () => {}
  )
  if (reply.failed) return err(reply.text)
  const parsed = parseAgentDraft(reply.text)
  if (!parsed) return err('El agente no devolvio un borrador valido')
  return ok(context.agentDrafts.set(capabilityId, { ...parsed, iconName: 'sparkles' }))
}
