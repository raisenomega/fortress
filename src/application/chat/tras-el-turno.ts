import type { ChatMessage } from '@domain/chat/chat-message'
import type { SinCierre } from '@domain/chat/motivo-sin-cierre'
import type { AppContext } from '../context'
import { cerrarYContar } from './cerrar-ciclo-terminal'
import type { TurnoProtegido } from './con-red-de-reversion'
import { recordarSesion } from './memoria-por-hallazgo'

/**
 * Lo que pasa DESPUES de guardar la respuesta de un turno (ADR-088): primero la
 * memoria del productor (pieza 4), que no depende del cierre y no debe perderse
 * si el cierre falla; despues el cierre del ciclo (pieza 3). Sin foco, nada.
 *
 * Devuelve la guarda que corto el cierre, si corto, para que el parte del lote
 * pueda decir POR QUE en vez de meterlo todo en el mismo cajon.
 */
export async function trasElTurno(
  context: AppContext,
  findingId: string | null,
  turno: TurnoProtegido,
  respuesta: ChatMessage
): Promise<SinCierre | null> {
  recordarSesion(context, findingId, turno)
  return cerrarYContar(context, findingId, turno, respuesta)
}
