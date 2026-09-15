import type { AgentId } from '@domain/agent/agent'
import { AGENT_CATALOG } from '@domain/agent/agent-catalog'
import { routeToAgent } from '@domain/agent/agent-router'
import { PRODUCTOR } from '@domain/agent/productor'
import { buildChatPrompt } from '@domain/chat/chat-prompt'
import type { CodeAgentRequest } from '@domain/chat/code-agent'
import { permissionModeFor } from '@domain/settings/permission-mode'
import { totalTokens } from '@domain/telemetry/token-usage'
import { correrConMemoria } from './correr-con-memoria'
import type { ReplyOutcome } from './reply-outcome'
import type { WorkflowReplyOptions } from './reply-from-workflow'
import { denialsNote, singleAgentOutcome } from './single-agent-outcome'

/** Las opciones de siempre y, si el turno resuelve UN hallazgo, su bloque ya
 *  saneado (ADR-088, pieza 2) y la sesion del productor para reanudarlo
 *  (Enmienda 2). Sin foco, el prompt de siempre y sin memoria. */
export type ChatReplyOptions = WorkflowReplyOptions & {
  readonly enFoco?: string
  readonly sesion?: string | null
}

/**
 * Quien contesta. Con foco, SIEMPRE el productor: resolver un hallazgo no se
 * reparte por palabras (ADR-088, Enmienda 2). Sin foco, el chat libre conserva
 * el router, entre los agentes que el operador no dejo fuera.
 */
function quienContesta(options: ChatReplyOptions): AgentId {
  if (options.enFoco !== undefined) return PRODUCTOR.id
  const enabled = AGENT_CATALOG.map((agent) => agent.id).filter(
    (id) => !options.excludedAgents.includes(id)
  )
  return routeToAgent(options.prompt, enabled)
}

/** La peticion al CLI. La sesion, solo si hay que reanudar: sin llave, nueva. */
function peticion(options: ChatReplyOptions, agentId: AgentId): CodeAgentRequest {
  const { project, mode } = options
  return {
    projectPath: project.path,
    // Dueño del proceso EN LA PETICION: sin el, Detener no alcanzaria al hijo.
    projectId: options.project.id,
    // prettier-ignore
    prompt: buildChatPrompt(options.prompt, { projectName: project.name, corpus: options.corpus, known: options.known, mode, enFoco: options.enFoco }),
    permissionMode: permissionModeFor(mode),
    agentId,
    trusted: project.trusted,
    ...(options.sesion ? { reanudarSesion: options.sesion } : {})
  }
}

/**
 * Respuesta conversacional a una pregunta libre: un solo agente, elegido por el
 * tema del mensaje, contesta en prosa. Se separa del camino de workflow porque
 * una pregunta no es un escaneo: no lleva pasos ni informe consolidado, lleva
 * la respuesta del agente tal cual la escribio.
 */
export async function replyFromChat(options: ChatReplyOptions): Promise<ReplyOutcome> {
  const agentId = quienContesta(options)

  options.onStep({ index: 0, total: 1, tokens: 0, costUsd: 0 })

  const startedAt = Date.now()
  // prettier-ignore
  const corrida = await correrConMemoria(options.codeAgent, peticion(options, agentId), options.onChunk, options.isCancelled)
  const { reply } = corrida

  // El consumo se conoce al terminar (el CLI lo reporta en el evento final): sin
  // esto el medidor de un solo agente se quedaba en 0 todo el run.
  options.onStep({ index: 0, total: 1, tokens: totalTokens(reply.usage), costUsd: reply.usage.costUsd }) // prettier-ignore

  // La nota de denials da la transparencia del modo supervisado (lo bloqueado).
  const outcome = singleAgentOutcome(agentId, reply, denialsNote(options.mode, reply.denials), startedAt) // prettier-ignore
  const { sesion, sesionRota } = corrida
  return { ...outcome, ...(sesion === undefined ? {} : { sesion }), sesionRota }
}
