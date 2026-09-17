import type { ChatMessage } from '@domain/chat/chat-message'
import { notaDeNoConvergio, parteDeNoConvergio } from '@domain/chat/no-convergio'
import type { SinCierre } from '@domain/chat/motivo-sin-cierre'
import { countEdits } from '@domain/telemetry/edit-tools'
import type { AppContext } from '../context'
import { appendMessage } from './chat-history'
import type { TurnoProtegido } from './con-red-de-reversion'

/**
 * Deja constancia de que el ciclo NO convergio, en los dos sitios donde el
 * operador mira (ADR-090, amplia ADR-088 pieza 3):
 *
 *   la FILA del hallazgo — con la objecion del revisor, para que al volver al
 *   Escaneo se vea por que no salio sin tener que abrir el hilo;
 *   el HILO del Terminal — como aviso `system`, que no entra en ningun prompt.
 *
 * El hallazgo se queda ACTIVO a proposito: no se mitiga —no hay nada que
 * mitigar, el arbol volvio atras— y no se descarta —el problema sigue ahi—.
 * Marcarlo de cualquier otra forma seria decir que paso algo que no paso.
 */
export function registrarNoConvergio(
  context: AppContext,
  findingId: string,
  turno: TurnoProtegido,
  respuesta: ChatMessage,
  razon: string,
  intentos: number
): SinCierre {
  context.findings.anotarVerificacion(findingId, notaDeNoConvergio(razon, intentos))
  const { projectId, mode, engine } = respuesta
  const content = parteDeNoConvergio(razon, intentos)
  appendMessage(context, { projectId, role: 'system', content, agentId: null, mode, engine })

  const { edits, tools } = turno.outcome
  return { motivo: 'no-convergio', edits: { porNombre: countEdits(tools), porRuta: edits.length } }
}
