import type { AgentId } from '@domain/agent/agent'
import type { CodeAgentReply } from '@domain/chat/code-agent'
import type { OperationMode } from '@domain/settings/operation-mode'
import type { ReplyOutcome } from './reply-outcome'

/**
 * Lo que el permiso bloqueo, para que el operador lo vea al final.
 *
 * DICE POR QUE SE BLOQUEO DE VERDAD. En el turno de plan decia «por el modo
 * supervisado» sobre un proyecto en AUTONOMO —porque ese turno viaja con ese
 * mode para no editar—, y leerlo asi fue parte del BUG 2: el operador veia
 * «supervisado» donde habia elegido autonomo. Lo que bloquea alli no es el
 * modo del proyecto: es que un plan solo lee.
 */
export function denialsNote(
  mode: OperationMode,
  denials: readonly string[],
  enPlan = false
): string {
  if (denials.length === 0) return ''
  const motivo = enPlan ? 'en el turno de plan, que solo lee' : `por el modo ${mode}`
  return (
    `\n\n---\nBloqueado ${motivo} (${denials.length}):\n` +
    denials.map((denial) => `- ${denial}`).join('\n')
  )
}

/** ReplyOutcome de un solo agente conversacional: un run, sin hallazgos. */
export function singleAgentOutcome(
  agentId: AgentId,
  reply: CodeAgentReply,
  note: string,
  startedAt: number
): ReplyOutcome {
  return {
    text: reply.text + note,
    failed: reply.failed,
    usage: reply.usage,
    tools: reply.tools,
    recibo: reply.recibo,
    edits: reply.edits,
    agents: [agentId],
    runs: [
      {
        agentId,
        usage: reply.usage,
        failed: reply.failed,
        durationMs: Date.now() - startedAt,
        tools: reply.tools,
        recibo: reply.recibo,
        ...(reply.modelo === undefined ? {} : { modelo: reply.modelo })
      }
    ],
    findings: [],
    // Ademas de la nota que el operador lee: la nota es prosa para la pantalla,
    // esto es dato para aprender. Los mismos bloqueos, dos usos.
    deniedTools: reply.deniedTools ?? []
  }
}
