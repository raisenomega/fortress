import type { AgentId } from '@domain/agent/agent'
import type { NewActivity } from '@domain/telemetry/activity'
import type { ChatEngine } from '@domain/chat/code-agent'
import { redactSecrets } from '@domain/chat/tool-detail'
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

  // El prompt es texto literal del operador y puede llevar un token pegado. Se
  // tacha ENTERO y despues se recorta: recortado antes, un secreto partido en el
  // borde deja de casar con el patron y queda a medias en el timeline.
  // El rotulo del motor queda fuera del tachado: es texto nuestro.
  const cabecera: NewActivity = {
    projectId,
    agentId,
    kind: 'chat',
    summary: `${shorten(redactSecrets(prompt))} (${motor})`,
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
