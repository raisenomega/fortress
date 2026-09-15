import type { ChatMessage } from '@domain/chat/chat-message'
import type { AppContext } from '../context'
import { cerrarYContar } from './cerrar-ciclo-terminal'
import type { TurnoProtegido } from './con-red-de-reversion'
import { recordarSesion } from './memoria-por-hallazgo'

/**
 * Lo que pasa DESPUES de guardar la respuesta de un turno (ADR-088): primero la
 * memoria del productor (pieza 4), que no depende del cierre y no debe perderse
 * si el cierre falla; despues el cierre del ciclo (pieza 3). Sin foco, nada.
 */
export async function trasElTurno(
  context: AppContext,
  findingId: string | null,
  turno: TurnoProtegido,
  respuesta: ChatMessage
): Promise<void> {
  recordarSesion(context, findingId, turno)
  await cerrarYContar(context, findingId, turno, respuesta)
}
