import { AGENT_CATALOG } from '@domain/agent/agent-catalog'
import { routeToAgent } from '@domain/agent/agent-router'
import { buildChatPrompt } from '@domain/chat/chat-prompt'
import { permissionModeFor } from '@domain/settings/permission-mode'
import { totalTokens } from '@domain/telemetry/token-usage'
import type { ReplyOutcome } from './reply-outcome'
import type { WorkflowReplyOptions } from './reply-from-workflow'
import { denialsNote, singleAgentOutcome } from './single-agent-outcome'

/**
 * Respuesta conversacional a una pregunta libre: un solo agente, elegido por el
 * tema del mensaje, contesta en prosa. Se separa del camino de workflow porque
 * una pregunta no es un escaneo: no lleva pasos ni informe consolidado, lleva
 * la respuesta del agente tal cual la escribio.
 */
export async function replyFromChat(options: WorkflowReplyOptions): Promise<ReplyOutcome> {
  const enabled = AGENT_CATALOG.map((agent) => agent.id).filter(
    (id) => !options.excludedAgents.includes(id)
  )
  const agentId = routeToAgent(options.prompt, enabled)

  options.onStep({ index: 0, total: 1, tokens: 0, costUsd: 0 })

  const startedAt = Date.now()
  const reply = await options.codeAgent.run(
    {
      projectPath: options.project.path,
      projectId: options.project.id,
      prompt: buildChatPrompt(options.prompt, {
        projectName: options.project.name,
        corpus: options.corpus,
        known: options.known,
        mode: options.mode
      }),
      permissionMode: permissionModeFor(options.mode),
      agentId,
      trusted: options.project.trusted
    },
    options.onChunk
  )

  // El consumo se conoce al terminar (el CLI lo reporta en el evento final): sin
  // esto el medidor de un solo agente se quedaba en 0 todo el run.
  options.onStep({
    index: 0,
    total: 1,
    tokens: totalTokens(reply.usage),
    costUsd: reply.usage.costUsd
  })

  // La nota de denials da la transparencia del modo supervisado (lo bloqueado).
  return singleAgentOutcome(agentId, reply, denialsNote(options.mode, reply.denials), startedAt)
}
