import type { CodeAgent, CodeAgentReply, CodeAgentRequest } from '@domain/chat/code-agent'

/** Lo que deja una corrida con memoria: la respuesta, la sesion que merece
 *  recordarse si la hay, y si la que se pidio reanudar estaba rota. */
export interface CorridaConMemoria {
  readonly reply: CodeAgentReply
  readonly sesion?: string
  readonly sesionRota: boolean
}

/** Una sesion de cero turnos no es una conversacion: no hay nada que reanudar. */
function sesionUtil(reply: CodeAgentReply): Omit<CorridaConMemoria, 'reply' | 'sesionRota'> {
  return reply.turns === 0 || reply.sessionId === undefined ? {} : { sesion: reply.sessionId }
}

/**
 * `--resume` roto: se pidio reanudar y el CLI fallo SIN correr un solo turno.
 * Medido en el CLI 2.1.272 con una sesion que no existe: `is_error`,
 * `num_turns: 0` y un session_id NUEVO que no es el pedido. Por eso no basta con
 * mirar si hay id —lo hay, y es falso—. Sin evento final, tampoco hay turnos.
 */
function resumeRoto(request: CodeAgentRequest, reply: CodeAgentReply): boolean {
  if (request.reanudarSesion === undefined || !reply.failed) return false
  return reply.turns === 0 || reply.sessionId === undefined
}

/**
 * Corre el turno con la memoria del hallazgo (ADR-088, Enmienda 2).
 *
 * GARANTIA 2: una memoria rota nunca bloquea resolver. Si la sesion guardada ya
 * no se puede reanudar —se borro, el proyecto se movio—, se marca para
 * olvidarla y el turno arranca con una sesion nueva. Salvo que el operador haya
 * pulsado Detener: entonces no se relanza nada.
 *
 * Y Detener no rompe la sesion. Parado, el CLI muere SIN evento final —medido en
 * el 2.1.272: SIGTERM -> code 143, sin `result`— y eso tiene la forma de un roto,
 * pero la guardada sigue valida: con `--fork-session` ni se toco. Con Detener,
 * solo se olvida si el CLI llego a contestar el roto de verdad —su evento final
 * con cero turnos—; si no, la memoria del hallazgo se deja intacta.
 */
export async function correrConMemoria(
  codeAgent: CodeAgent,
  request: CodeAgentRequest,
  onChunk: (delta: string) => void,
  isCancelled: () => boolean
): Promise<CorridaConMemoria> {
  const reply = await codeAgent.run(request, onChunk)
  if (!resumeRoto(request, reply)) return { reply, ...sesionUtil(reply), sesionRota: false }
  if (isCancelled()) return { reply, sesionRota: reply.turns === 0 }

  const nueva = await codeAgent.run({ ...request, reanudarSesion: undefined }, onChunk)
  return { reply: nueva, ...sesionUtil(nueva), sesionRota: true }
}
