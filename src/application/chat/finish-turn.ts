import type { ChatEngine } from '@domain/chat/code-agent'
import type { ChatMessage } from '@domain/chat/chat-message'
import { observacionesDeDenials } from '@domain/chat/observacion-de-denial'
import { redactSecrets } from '@domain/chat/tool-detail'
import type { Project } from '@domain/project/project'
import type { OperationMode } from '@domain/settings/operation-mode'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { persistQuality } from '../scan/persist-quality'
import { recordChatRun } from '../telemetry/record-chat-run'
import { asentarNotas } from '../system/asentar-notas'
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
  // La prosa del agente, tachada antes de entrar en la base. Es el CUARTO sitio
  // de la familia: los canales mecanicos —comandos, colas del spawn, stderr— ya
  // se tachaban, y lo que quedaba crudo era lo que el agente ESCRIBE, que puede
  // citar un token que acaba de leer. Aqui y no en cada motor porque `finishTurn`
  // es el unico paso por el que pasan todos, y sobre el texto ENTERO: es la
  // unica forma de alcanzar un secreto que el stream partio en dos.
  //
  // El aviso queda fuera del tachado: es texto nuestro, no del agente.
  const texto = redactSecrets(outcome.text) + input.aviso
  const stored = persistTurn(context, project.id, meta, 'assistant', texto, agentId)
  if (!stored.ok) return err(stored.error)

  recordChatRun(context, { project, agentId, engine: meta.engine, outcome, startedAt: input.startedAt, prompt: input.prompt }) // prettier-ignore
  // Lo que FORTRESS le nego a su propio agente, asentado como observacion
  // (ADR-085). Aqui y no en el motor por lo mismo que el tachado: `finishTurn`
  // es el unico paso por el que pasan todos los turnos del chat. Sin spawn
  // extra y sin bloque en el stream — el dato ya estaba, solo se perdia.
  asentarNotas(context, project, observacionesDeDenials(outcome.deniedTools ?? [], meta.mode))
  // Auditoria integral -> fija la CALIDAD GENERAL del proyecto (la tarjeta la muestra).
  if (outcome.comprehensive) persistQuality(context, project, outcome.findings)

  return ok(stored.value)
}
