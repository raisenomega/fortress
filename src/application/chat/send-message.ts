import type { AgentId } from '@domain/agent/agent'
import { routeToAgent } from '@domain/agent/agent-router'
import type { Assistant, AssistantTurn } from '@domain/chat/assistant'
import type { ChatMessage } from '@domain/chat/chat-message'
import { effectiveMode, type OperationMode } from '@domain/settings/operation-mode'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { appendMessage } from './chat-history'
import { buildSystemPrompt } from './system-prompt'

export interface SendMessageInput {
  readonly projectId: string
  readonly prompt: string
  readonly mode: OperationMode
  readonly enabledAgents: readonly AgentId[]
}

export interface SendMessageOutput {
  readonly user: ChatMessage
  readonly assistant: ChatMessage
}

/** El asistente solo ve texto: los roles `system` guardados no se reenvian. */
function toTurns(history: readonly ChatMessage[]): AssistantTurn[] {
  return history
    .filter((message) => message.role !== 'system')
    .map((message) => ({ role: message.role as AssistantTurn['role'], content: message.content }))
}

export async function sendMessage(
  context: AppContext,
  assistant: Assistant,
  input: SendMessageInput,
  onChunk: (delta: string) => void
): Promise<Result<SendMessageOutput>> {
  const project = context.projects.findById(input.projectId)
  if (!project) return err('El proyecto ya no existe')

  // El modo degrada a supervisado si la peticion toca un area protegida.
  const mode = effectiveMode(input.mode, input.prompt)
  const agentId = routeToAgent(input.prompt, input.enabledAgents)

  const saved = appendMessage(context, {
    projectId: input.projectId,
    role: 'user',
    content: input.prompt,
    agentId: null,
    mode
  })
  if (!saved.ok) return err(saved.error)

  const reply = await assistant.stream(
    {
      system: buildSystemPrompt(project, input.enabledAgents, mode),
      turns: toTurns(context.chat.listByProject(input.projectId))
    },
    onChunk
  )

  const text = reply.refused
    ? 'La peticion fue declinada por los clasificadores de seguridad del modelo.'
    : reply.text

  const stored = appendMessage(context, {
    projectId: input.projectId,
    role: 'assistant',
    content: text,
    agentId,
    mode
  })
  if (!stored.ok) return err(stored.error)

  return ok({ user: saved.value, assistant: stored.value })
}
