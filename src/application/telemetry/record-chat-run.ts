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
      // Un run POR agente: sin esto el workflow entero se anotaba como un solo
      // run del primer agente, y no se veia cuanto gasto cada uno.
      if (outcome.runs.length > 0) {
        for (const run of outcome.runs) {
          context.runs.record({
            projectId: project.id,
            agentId: run.agentId,
            kind: 'chat',
            durationMs: run.durationMs,
            failed: run.failed,
            usage: run.usage,
            tools: run.tools,
            recibo: run.recibo
          })
        }
      } else {
        context.runs.record({
          projectId: project.id,
          agentId,
          kind: 'chat',
          durationMs: Date.now() - startedAt,
          failed: outcome.failed,
          usage: outcome.usage,
          tools: outcome.tools,
          recibo: outcome.recibo
        })
      }

      context.activity.recordMany(chatActivity(project.id, agentId, engine, prompt, outcome))
    })
  } catch {
    // Silencio deliberado: el operador ya tiene su respuesta en pantalla.
  }
}
