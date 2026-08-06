import type { ChatMessage } from './chat-message'
import { configurationGuidance } from './configuration-guidance'

function transcript(history: readonly ChatMessage[]): string {
  if (history.length === 0) {
    return 'El operador acaba de crear el proyecto. Saluda breve y haz la PRIMERA pregunta.'
  }
  return history
    .filter((message) => message.role !== 'system')
    .map((message) => `${message.role === 'user' ? 'Operador' : 'FORTRESS'}: ${message.content}`)
    .join('\n\n')
}

/**
 * Prompt de un turno de la entrevista: guia rectora + la conversacion hasta
 * ahora. claude -p es stateless por turno, asi que el contexto viaja aqui.
 */
export function buildConfigurationPrompt(
  history: readonly ChatMessage[],
  projectName: string
): string {
  return [
    configurationGuidance(projectName),
    '--- Conversacion hasta ahora ---',
    transcript(history),
    '--- Responde al ultimo mensaje del operador. ---'
  ].join('\n\n')
}
