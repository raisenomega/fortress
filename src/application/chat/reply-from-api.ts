import type { AgentId } from '@domain/agent/agent'
import type { Assistant, AssistantTurn } from '@domain/chat/assistant'
import type { ChatMessage } from '@domain/chat/chat-message'
import type { Project } from '@domain/project/project'
import type { OperationMode } from '@domain/settings/operation-mode'
import type { AppContext } from '../context'
import { textOnly, type ReplyOutcome } from './reply-outcome'
import { buildSystemPrompt } from './system-prompt'

export interface ApiReplyOptions {
  readonly context: AppContext
  readonly assistant: Assistant
  readonly project: Project
  readonly enabledAgents: readonly AgentId[]
  readonly mode: OperationMode
  readonly onChunk: (delta: string) => void
}

/** El asistente solo ve texto: los roles `system` guardados no se reenvian. */
function toTurns(history: readonly ChatMessage[]): AssistantTurn[] {
  return history
    .filter((message) => message.role !== 'system')
    .map((message) => ({ role: message.role as AssistantTurn['role'], content: message.content }))
}

/**
 * Camino de respaldo: responde la API sin acceso al proyecto. No lee archivos
 * ni ejecuta nada; es lo que queda cuando Claude Code no esta instalado.
 */
export async function replyFromApi(options: ApiReplyOptions): Promise<ReplyOutcome> {
  const { context, assistant, project, enabledAgents, mode, onChunk } = options

  const reply = await assistant.stream(
    {
      system: buildSystemPrompt(project, enabledAgents, mode, context.corpus.of(project.path)),
      turns: toTurns(context.chat.listByProject(project.id))
    },
    onChunk
  )

  const text = reply.refused
    ? 'La peticion fue declinada por los clasificadores de seguridad del modelo.'
    : reply.text

  return textOnly(text, reply.usage)
}
