import type { CodeAgent } from '@domain/chat/code-agent'
import type { CapabilityEpisode } from '@domain/system/capability-episode'
import { buildEpisodePrompt, parseEpisode } from '@domain/system/episode-prompt'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/**
 * Autonomia real (acotada, un disparo): la capacidad se plantea UN escenario y
 * lo resuelve; el resultado se registra como un episodio PROPIO (con el que
 * madura). Corre en un sandbox y en 'lectura' (no edita, sin Bash, y ve el
 * grafo: en 'plan' el MCP entero quedaba bloqueado). El agente se inyecta:
 * la logica es testeable; la corrida real la lanza el IPC.
 */
export async function runLearningEpisode(
  context: AppContext,
  capabilityId: string,
  agent: CodeAgent,
  sandboxPath: string
): Promise<Result<CapabilityEpisode>> {
  const capability = context.capabilities.findById(capabilityId)
  if (!capability) return err('Esa capacidad ya no existe')
  const definition = context.agentDrafts.get(capabilityId)?.prompt ?? ''
  const prompt = buildEpisodePrompt(capability.name, definition)
  const reply = await agent.run(
    { projectPath: sandboxPath, prompt, permissionMode: 'lectura', agentId: null, trusted: false },
    () => {}
  )
  if (reply.failed) return err(reply.text)
  const parsed = parseEpisode(reply.text)
  if (!parsed) return err('El episodio no produjo un resultado claro')
  return ok(context.capabilityEpisodes.record({ capabilityId, ...parsed }))
}
