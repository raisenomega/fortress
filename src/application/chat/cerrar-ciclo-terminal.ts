import { notaDelCierre, parteDelCierre, pendienteDeVerificar, type CierreDelCiclo } from '@domain/chat/cierre-del-ciclo' // prettier-ignore
import type { ChatMessage } from '@domain/chat/chat-message'
import type { AppContext } from '../context'
import { verificarMitigado } from '../repair/verificar-mitigado'
import { markMitigatedFinding } from '../scan/dismiss-finding'
import { appendMessage } from './chat-history'
import type { TurnoProtegido } from './con-red-de-reversion'

const SIN_LANZAR = 'no se lanzo: una propuesta viva del motor lo trabaja, o ya no es verificable'

/**
 * Un turno verde del Terminal que resolvia un hallazgo cierra su ciclo (ADR-088,
 * pieza 3): lo marca mitigado y lanza la verificacion de ADR-087 a nombre del
 * Terminal. El desenlace es el natural: con prueba muere y va a Historia; sin
 * ella sigue mitigado; si el problema sigue, vuelve a la cola.
 *
 * GUARDAS: sin foco no hay hallazgo; sin la red que conservo el turno, nada
 * garantiza lo que quedo en el arbol; sin ediciones no se arreglo nada. El modo
 * no hace falta mirarlo: solo el autonomo con CLI tiene red, y solo el edita.
 *
 * LA LINEA ROJA: entre marcar y verificar no puede quedar un mitigado MUDO. Si
 * la verificacion lanza —el analista revienta, Detener lo mata— o no se lanza,
 * la fila lo dice en su nota de verificacion y sigue en Escaneo, re-verificable.
 */
export async function cerrarCicloTerminal(
  context: AppContext,
  projectId: string,
  findingId: string | null,
  turno: TurnoProtegido,
  messageId: string
): Promise<CierreDelCiclo | null> {
  const { edits } = turno.outcome
  if (findingId === null || !turno.conservado || edits.length === 0) return null

  const raiz = context.projects.findById(projectId)?.path ?? ''
  const marcado = markMitigatedFinding(context, findingId, notaDelCierre(messageId, edits, raiz))
  if (!marcado.ok) return { desenlace: 'no_vivo' }
  try {
    const dictamen = await verificarMitigado(context, projectId, findingId, 'terminal')
    if (dictamen === null) return pendiente(context, findingId, SIN_LANZAR)
    return { desenlace: dictamen.desenlace }
  } catch (error) {
    return pendiente(context, findingId, error instanceof Error ? error.message : String(error))
  }
}

function pendiente(context: AppContext, findingId: string, motivo: string): CierreDelCiclo {
  context.findings.anotarVerificacion(findingId, pendienteDeVerificar(motivo))
  return { desenlace: 'pendiente', motivo }
}

/** Cierra y lo CUENTA en el Terminal, como aviso del sistema: el turno no puede
 *  dejar creer que se cerro lo que no. `system` no entra en ningun prompt. */
export async function cerrarYContar(
  context: AppContext,
  findingId: string | null,
  turno: TurnoProtegido,
  respuesta: ChatMessage
): Promise<void> {
  const { id, projectId, mode, engine } = respuesta
  const cierre = await cerrarCicloTerminal(context, projectId, findingId, turno, id)
  if (cierre === null) return
  const content = parteDelCierre(cierre)
  appendMessage(context, { projectId, role: 'system', content, agentId: null, mode, engine })
}
