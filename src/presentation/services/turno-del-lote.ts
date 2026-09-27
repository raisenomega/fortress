import { desenlaceEnLote, type DesenlaceEnLote } from '@domain/chat/desenlace-del-lote'
import type { Negativa } from '@domain/chat/envio-negado'
import type { SinCierre } from '@domain/chat/motivo-sin-cierre'
import type { Finding } from '@domain/project/finding'
import { seResuelveEnTerminal } from '@domain/project/se-resuelve-en-terminal'
import type { PuertosDeLaCola } from './cola-del-lote'
import { borradorDeResolucion } from './resolver-en-terminal'

/** Como quedo el turno Y, si el cierre no llego a intentarse, que guarda corto. */
export interface TurnoDelLote {
  readonly desenlace: DesenlaceEnLote
  readonly sinCierre: SinCierre | null
  /** Se conservo, pero nadie pudo compilar el proyecto (ADR-091). */
  readonly sinVerificar: boolean
  /** Una puerta del main nego el envio: el turno no llego a existir. */
  readonly negado: Negativa | null
}

const SIN_TURNO = { sinCierre: null, sinVerificar: false } as const

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
): Promise<TurnoDelLote> {
  const antes = p.hallazgo(id)
  if (antes === undefined || !pideTrabajo(antes))
    return { ...SIN_TURNO, desenlace: 'omitido', negado: null }
  p.abrirTerminal()
  const prompt = borradorDeResolucion(antes)
  const envio = await p.enviar({ projectId, prompt, mode: 'autonomo', excludedAgents: p.excluidos(), findingId: id, lote: ids }) // prettier-ignore
  // NEGADO: no hubo turno, asi que no hay nada que recargar ni que inferir de la
  // base. Sin esto el hallazgo «seguia como estaba» y se contaba como no_cerro.
  if (envio.negado !== null) return { ...SIN_TURNO, desenlace: 'negado', negado: envio.negado }
  await p.recargar()
  const desenlace = desenlaceEnLote(antes, p.hallazgo(id), envio.sinCierre)
  return { desenlace, sinCierre: envio.sinCierre, sinVerificar: envio.sinVerificar, negado: null }
}
