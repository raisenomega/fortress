import { AGENT_CATALOG } from '@domain/agent/agent-catalog'
import { routeToAgent } from '@domain/agent/agent-router'
import { buildChatPrompt } from '@domain/chat/chat-prompt'
import { permissionModeFor } from '@domain/settings/permission-mode'
import type { ReplyOutcome } from './reply-outcome'
import type { WorkflowReplyOptions } from './reply-from-workflow'

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

  const reply = await options.codeAgent.run(
    {
      projectPath: options.project.path,
      prompt: buildChatPrompt(options.prompt, {
        projectName: options.project.name,
        known: options.known,
        mode: options.mode
      }),
      permissionMode: permissionModeFor(options.mode),
      agentId,
      trusted: options.project.trusted
    },
    options.onChunk
  )

  return {
    text: reply.text,
    failed: reply.failed,
    usage: reply.usage,
    tools: reply.tools,
    edits: reply.edits,
    agents: [agentId],
    findings: []
  }
}
