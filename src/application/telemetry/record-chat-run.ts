import type { AgentId } from '@domain/agent/agent'
import type { ChatEngine } from '@domain/chat/code-agent'
import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'
import type { ReplyOutcome } from '../chat/reply-outcome'
import { chatActivity } from './chat-activity'

export interface ChatRunInput {
  readonly project: Project
  readonly agentId: AgentId | null
  readonly engine: ChatEngine
  readonly outcome: ReplyOutcome
  readonly startedAt: number
  readonly prompt: string
}

/**
 * Deja constancia de lo que costo el mensaje y de lo que el agente toco. Va
 * despues de guardar la respuesta y nunca hace fallar el envio: perder una
 * fila de telemetria es molesto, perder la respuesta del agente no.
 */
export function recordChatRun(context: AppContext, input: ChatRunInput): void {
  const { project, agentId, engine, outcome, startedAt, prompt } = input

  try {
    context.transaction(() => {
      context.runs.record({
        projectId: project.id,
        agentId,
        kind: 'chat',
        durationMs: Date.now() - startedAt,
        failed: outcome.failed,
        usage: outcome.usage,
        tools: outcome.tools
      })

      context.activity.recordMany(chatActivity(project.id, agentId, engine, prompt, outcome))
    })
  } catch {
    // Silencio deliberado: el operador ya tiene su respuesta en pantalla.
  }
}
