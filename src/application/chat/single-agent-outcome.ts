import type { AgentId } from '@domain/agent/agent'
import type { CodeAgentReply } from '@domain/chat/code-agent'
import type { OperationMode } from '@domain/settings/operation-mode'
import type { ReplyOutcome } from './reply-outcome'

/** Lo que el permiso bloqueo, para que el operador lo vea al final de la respuesta. */
export function denialsNote(mode: OperationMode, denials: readonly string[]): string {
  if (denials.length === 0) return ''
  return (
    `\n\n---\nBloqueado por el modo ${mode} (${denials.length}):\n` +
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
    edits: reply.edits,
    agents: [agentId],
    runs: [
      {
        agentId,
        usage: reply.usage,
        failed: reply.failed,
        durationMs: Date.now() - startedAt,
        tools: reply.tools
      }
    ],
    findings: []
  }
}
