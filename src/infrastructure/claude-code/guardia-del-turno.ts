import type { CodeAgentRequest } from '@domain/chat/code-agent'
import type { CodeAgentReply } from '@domain/chat/code-agent-reply'
import { findAgent } from '@domain/agent/agent-catalog'
import { ESCALERA, type Peldano } from '@domain/agent/escalera-de-modelos'
import { juzgarModelo } from '@domain/agent/guardia-del-modelo'

/** Lo que el turno PIDIO: el modelo declarado del agente (ADR-078), o el del
 *  turno sin agente. Un agente sin modelo (auto-propuesto, ADR-078 lo deja
 *  heredar) se juzga contra la base: solo Fable puede fallarle. */
function pedido(request: CodeAgentRequest): Peldano {
  const del = request.agentId === null ? request.model : findAgent(request.agentId)?.model
  return (ESCALERA as readonly string[]).includes(del ?? '') ? (del as Peldano) : 'haiku'
}

/**
 * El guardian del modelo en el TURNO (ADR-078, enmienda 2026-10-05): lo que
 * DE VERDAD corrio contra lo pedido. FALLA (Fable, o por debajo) → turno
 * fallido y dicho en el texto; AVISO (un opus mas viejo de fallback) → se dice
 * y se sigue. El modelo real viaja en la respuesta para que se asiente.
 */
export function conGuardiaDelModelo(request: CodeAgentRequest, reply: CodeAgentReply): CodeAgentReply {
  const juicio = juzgarModelo(pedido(request), reply.modelos ?? [])
  const conModelo = juicio.modelo === null ? reply : { ...reply, modelo: juicio.modelo }
  if (juicio.veredicto === 'ok') return conModelo
  const nota = `\n\n[FORTRESS] ${juicio.veredicto === 'falla' ? 'modelo no asignado' : 'aviso de modelo'}: ${juicio.motivo ?? ''}` // prettier-ignore
  return { ...conModelo, text: `${reply.text}${nota}`, failed: reply.failed || juicio.veredicto === 'falla' } // prettier-ignore
}
