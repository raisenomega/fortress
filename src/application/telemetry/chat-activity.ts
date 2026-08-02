import type { AgentId } from '@domain/agent/agent'
import type { NewActivity } from '@domain/telemetry/activity'
import type { ChatEngine } from '@domain/chat/code-agent'
import type { ReplyOutcome } from '../chat/reply-outcome'

const MAX_SUMMARY = 90

/** El timeline es un indice, no un archivo de conversaciones. */
function shorten(prompt: string): string {
  const limpio = prompt.trim().replace(/\s+/g, ' ')
  return limpio.length <= MAX_SUMMARY ? limpio : `${limpio.slice(0, MAX_SUMMARY - 1)}…`
}

/**
 * Un mensaje de chat deja una entrada, mas una por archivo que el agente haya
 * escrito. Con el motor de solo texto nunca hay ediciones: no toca el disco.
 */
export function chatActivity(
  projectId: string,
  agentId: AgentId | null,
  engine: ChatEngine,
  prompt: string,
  outcome: ReplyOutcome
): readonly NewActivity[] {
  const motor = engine === 'claude-code' ? 'Claude Code' : 'solo texto'

  const cabecera: NewActivity = {
    projectId,
    agentId,
    kind: 'chat',
    summary: `${shorten(prompt)} (${motor})`,
    severity: null,
    file: '',
    line: null
  }

  const ediciones = [...new Set(outcome.edits)].map((file): NewActivity => ({
    projectId,
    agentId,
    kind: 'edit',
    summary: 'Modifico el archivo',
    severity: null,
    file,
    line: null
  }))

  return [cabecera, ...ediciones]
}
