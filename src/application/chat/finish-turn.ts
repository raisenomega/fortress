import type { ChatEngine } from '@domain/chat/code-agent'
import type { ChatMessage } from '@domain/chat/chat-message'
import type { Project } from '@domain/project/project'
import type { OperationMode } from '@domain/settings/operation-mode'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { persistQuality } from '../scan/persist-quality'
import { recordChatRun } from '../telemetry/record-chat-run'
import { persistTurn } from './persist-message'
import type { ReplyOutcome } from './reply-outcome'

export interface FinishTurnInput {
  readonly context: AppContext
  readonly project: Project
  readonly meta: { readonly mode: OperationMode; readonly engine: ChatEngine }
  readonly outcome: ReplyOutcome
  /** Nota que se anade al texto del agente (degradaciones, avisos). */
  readonly aviso: string
  readonly startedAt: number
  readonly prompt: string
}

/**
 * Cierra el turno: persiste la respuesta, asienta la telemetria y, si el
 * workflow fue integral, fija la calidad general del proyecto.
 */
export function finishTurn(input: FinishTurnInput): Result<ChatMessage> {
  const { context, project, meta, outcome } = input
  // El chip del mensaje es el primer agente que participo de verdad.
  const agentId = outcome.agents[0] ?? null
  const texto = outcome.text + input.aviso
  const stored = persistTurn(context, project.id, meta, 'assistant', texto, agentId)
  if (!stored.ok) return err(stored.error)

  recordChatRun(context, { project, agentId, engine: meta.engine, outcome, startedAt: input.startedAt, prompt: input.prompt }) // prettier-ignore
  // Auditoria integral -> fija la CALIDAD GENERAL del proyecto (la tarjeta la muestra).
  if (outcome.comprehensive) persistQuality(context, project, outcome.findings)

  return ok(stored.value)
}
