import type { AgentId } from '@domain/agent/agent'
import { AGENT_CATALOG } from '@domain/agent/agent-catalog'
import { routeToAgent } from '@domain/agent/agent-router'
import { PRODUCTOR } from '@domain/agent/productor'
import { buildChatPrompt } from '@domain/chat/chat-prompt'
import type { CodeAgentRequest } from '@domain/chat/code-agent'
import { permissionModeFor } from '@domain/settings/permission-mode'
import { esTurnoDePlanDelLote, type SenasDelTurno } from '@domain/chat/turno-de-plan'
import { totalTokens } from '@domain/telemetry/token-usage'
import { correrConMemoria } from './correr-con-memoria'
import type { ReplyOutcome } from './reply-outcome'
import type { WorkflowReplyOptions } from './opciones-de-respuesta'
import { denialsNote, singleAgentOutcome } from './single-agent-outcome'

/** Las de siempre, las señas del turno (`SenasDelTurno`) y la sesion del
 *  productor para reanudarlo (ADR-088, Enmienda 2). */
export type ChatReplyOptions = WorkflowReplyOptions &
  SenasDelTurno & { readonly sesion?: string | null }

/**
 * Quien contesta. Con foco, SIEMPRE el productor: resolver un hallazgo no se
 * reparte por palabras (ADR-088, Enmienda 2). Con lote tambien: el plan lo
 * escribe quien luego lo ejecuta (arco 1). Sin ninguno, el chat libre conserva
 * el router, entre los agentes que el operador no dejo fuera.
 */
function quienContesta(options: ChatReplyOptions): AgentId {
  if (options.enFoco !== undefined || options.deLote === true) return PRODUCTOR.id
  const fuera = options.excludedAgents
  const enabled = AGENT_CATALOG.map((agent) => agent.id).filter((id) => !fuera.includes(id))
  return routeToAgent(options.prompt, enabled)
}

/** La peticion al CLI. La sesion solo si hay que reanudar: sin llave, nueva. */
function peticion(options: ChatReplyOptions, agentId: AgentId): CodeAgentRequest {
  const { project, mode } = options
  return {
    projectPath: project.path,
    // Dueño del proceso EN LA PETICION: sin el, Detener no alcanzaria al hijo.
    projectId: options.project.id,
    // prettier-ignore
    prompt: buildChatPrompt(options.prompt, { projectName: project.name, corpus: options.corpus, known: options.known, mode, enFoco: options.enFoco, deLote: options.deLote }),
    // 'lectura' y no el 'plan' que derivaria de supervisado: aquel BLOQUEA todo
    // el MCP (permission-mode.ts:4-8). Ve el grafo y sigue sin poder editar.
    permissionMode: esTurnoDePlanDelLote(options) ? 'lectura' : permissionModeFor(mode),
    agentId,
    trusted: project.trusted,
    ...(options.sesion ? { reanudarSesion: options.sesion } : {})
  }
}

/** Respuesta conversacional: un agente contesta en prosa. Se separa del camino
 *  de workflow porque una pregunta no es un escaneo: no lleva pasos ni informe
 *  consolidado, lleva la respuesta del agente tal cual la escribio. */
export async function replyFromChat(options: ChatReplyOptions): Promise<ReplyOutcome> {
  const agentId = quienContesta(options)

  const total = options.agentes ?? 1
  options.onStep({ index: 0, total, tokens: 0, costUsd: 0 })

  const startedAt = Date.now()
  // prettier-ignore
  const corrida = await correrConMemoria(options.codeAgent, peticion(options, agentId), options.onChunk, options.isCancelled)
  const { reply } = corrida

  // El consumo se conoce al terminar (lo reporta el evento final del CLI): sin
  // esto el medidor de un solo agente se quedaba en 0 todo el run.
  options.onStep({ index: 0, total, tokens: totalTokens(reply.usage), costUsd: reply.usage.costUsd }) // prettier-ignore

  // La nota de denials da la transparencia del modo supervisado (lo bloqueado).
  const nota = denialsNote(options.mode, reply.denials, esTurnoDePlanDelLote(options)) // prettier-ignore
  const outcome = singleAgentOutcome(agentId, reply, nota, startedAt)
  const { sesion, sesionRota } = corrida
  return { ...outcome, ...(sesion === undefined ? {} : { sesion }), sesionRota }
}
