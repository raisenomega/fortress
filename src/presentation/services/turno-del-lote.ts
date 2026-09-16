import { desenlaceEnLote, type DesenlaceEnLote } from '@domain/chat/desenlace-del-lote'
import type { Finding } from '@domain/project/finding'
import { seResuelveEnTerminal } from '@domain/project/se-resuelve-en-terminal'
import type { PuertosDeLaCola } from './cola-del-lote'
import { borradorDeResolucion } from './resolver-en-terminal'

const pideTrabajo = (f: Finding): boolean =>
  seResuelveEnTerminal({ dismissed: f.status === 'false_positive', mitigado: f.lifecycle === 'MITIGATED' }) // prettier-ignore

/**
 * UN hallazgo del lote: su turno con foco entero, y como quedo tras recargar.
 *
 * El foco va EN la peticion (`findingId`), no en el store del Terminal: la
 * puerta normal lo limpia al enviar, y esta cola no pasa por ella.
 *
 * Va en EDICION aunque el operador este en supervisado: el plan ya lo aprobo, y
 * esa aprobacion es la autorizacion del lote entero (ADR-088, arco 1). Y lleva
 * `lote` con todos los ids: el main deja fuera al del foco y los demas viajan
 * como contexto, para que el productor no repita el mismo patron.
 */
export async function turnoDelLote(
  projectId: string,
  id: string,
  ids: readonly string[],
  p: PuertosDeLaCola
): Promise<DesenlaceEnLote> {
  const antes = p.hallazgo(id)
  if (antes === undefined || !pideTrabajo(antes)) return 'omitido'
  p.abrirTerminal()
  const prompt = borradorDeResolucion(antes)
  await p.enviar({ projectId, prompt, mode: 'autonomo', excludedAgents: p.excluidos(), findingId: id, lote: ids }) // prettier-ignore
  await p.recargar()
  return desenlaceEnLote(antes, p.hallazgo(id))
}
