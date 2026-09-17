import type { ChatMessage } from '@domain/chat/chat-message'
import type { SinCierre } from '@domain/chat/motivo-sin-cierre'
import type { AppContext } from '../context'
import { cerrarYContar } from './cerrar-ciclo-terminal'
import type { TurnoProtegido } from './con-red-de-reversion'
import { recordarSesion } from './memoria-por-hallazgo'
import { registrarNoConvergio } from './registrar-no-convergio'

/** Lo que el ciclo de convergencia dejo dicho del turno (ADR-090). */
export interface DesenlaceDelCiclo {
  readonly convergio: boolean
  readonly razon: string | null
  readonly intentos: number
}

/** Un turno sin ciclo —supervisado, o sin foco— converge por definicion: se
 *  produjo una vez y no habia a quien reintentar. */
const CONVERGIO: DesenlaceDelCiclo = { convergio: true, razon: null, intentos: 1 }

/**
 * Lo que pasa DESPUES de guardar la respuesta de un turno (ADR-088): primero la
 * memoria del productor (pieza 4), que no depende del cierre y no debe perderse
 * si el cierre falla; despues el cierre del ciclo (pieza 3). Sin foco, nada.
 *
 * Devuelve la guarda que corto el cierre, si corto, para que el parte del lote
 * pueda decir POR QUE en vez de meterlo todo en el mismo cajon.
 *
 * TERCER DESENLACE (ADR-090): si el ciclo no convergio, no se pregunta por las
 * guardas de siempre. `no-conservado` seria verdad y a la vez inutil —diria que
 * el arbol volvio atras, callando que el revisor lo veto tres veces—, y el
 * operador se quedaria sin lo unico que explica el desenlace.
 */
export async function trasElTurno(
  context: AppContext,
  findingId: string | null,
  turno: TurnoProtegido,
  respuesta: ChatMessage,
  ciclo: DesenlaceDelCiclo = CONVERGIO
): Promise<SinCierre | null> {
  recordarSesion(context, findingId, turno)
  if (!ciclo.convergio && findingId !== null && ciclo.razon !== null) {
    return registrarNoConvergio(context, findingId, turno, respuesta, ciclo.razon, ciclo.intentos)
  }
  return cerrarYContar(context, findingId, turno, respuesta)
}
