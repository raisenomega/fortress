import type { CodeAgent } from '@domain/chat/code-agent'
import type { Project } from '@domain/project/project'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { getHistory } from './chat-history'
import { persistTurn, type MessageMeta } from './persist-message'
import { replyFromConfiguration } from './reply-from-configuration'
import type { SendMessageInput, SendMessageOutput } from './send-message-types'

/** La entrevista corre siempre supervisada (solo lectura) con el motor CLI. */
const CONFIG_META: MessageMeta = { mode: 'supervisado', engine: 'claude-code' }

/**
 * Turno de la entrevista de configuracion de un proyecto PENDIENTE. El agente
 * entrevista y propone docs en SOLO LECTURA; la app captura los borradores del
 * texto y solo escribe en disco tras "Si, ejecutar". El historial viaja al
 * prompt porque cada corrida de claude -p es una sesion nueva.
 */
export async function runConfigurationTurn(
  context: AppContext,
  codeAgent: CodeAgent,
  project: Project,
  input: SendMessageInput,
  onChunk: (delta: string) => void
): Promise<Result<SendMessageOutput>> {
  const user = persistTurn(context, project.id, CONFIG_META, 'user', input.prompt, null)
  if (!user.ok) return err(user.error)

  const history = getHistory(context, project.id)
  const reply = await replyFromConfiguration({ codeAgent, project, history, onChunk })

  const stored = persistTurn(context, project.id, CONFIG_META, 'assistant', reply.text, null)
  if (!stored.ok) return err(stored.error)

  return ok({ user: user.value, assistant: stored.value, engine: 'claude-code', sinCierre: null })
}
