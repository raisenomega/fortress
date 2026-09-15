import type { SendMessageInput } from '@application/chat/send-message-types'
import type { AgentId } from '@domain/agent/agent'
import { desenlaceEnLote, resumenDelLote, type DesenlaceEnLote } from '@domain/chat/desenlace-del-lote' // prettier-ignore
import type { Finding } from '@domain/project/finding'
import { seResuelveEnTerminal } from '@domain/project/se-resuelve-en-terminal'
import type { OperationMode } from '@domain/settings/operation-mode'
import { borradorDeResolucion } from './resolver-en-terminal'

/** Lo que la cola usa del mundo, inyectado: asi se prueba sin IPC ni React. */
export interface PuertosDeLaCola {
  readonly modo: () => OperationMode
  readonly excluidos: () => readonly AgentId[]
  /** El hallazgo tal como esta ahora en el renderer; undefined si ya no esta vivo. */
  readonly hallazgo: (findingId: string) => Finding | undefined
  readonly abrirTerminal: () => void
  /** `sendMessage` de chat-service: se resuelve con el turno ENTERO, cierre incluido. */
  readonly enviar: (input: SendMessageInput) => Promise<void>
  readonly recargar: () => Promise<void>
  readonly contar: (resumen: string) => Promise<void>
  readonly cola: {
    ocupada(): boolean
    arrancar(total: number): void
    avanzar(): void
    cortado(): boolean
    terminar(): void
  }
}

const pideTrabajo = (f: Finding): boolean =>
  seResuelveEnTerminal({ dismissed: f.status === 'false_positive', mitigado: f.lifecycle === 'MITIGATED' }) // prettier-ignore

/** UN hallazgo del lote: su turno con foco entero, y como quedo tras recargar.
 *  El foco va EN la peticion (`findingId`), no en el store del Terminal: la
 *  puerta normal lo limpia al enviar, y esta cola no pasa por ella. */
async function turno(projectId: string, id: string, p: PuertosDeLaCola): Promise<DesenlaceEnLote> {
  const antes = p.hallazgo(id)
  if (antes === undefined || !pideTrabajo(antes)) return 'omitido'
  p.abrirTerminal()
  const prompt = borradorDeResolucion(antes)
  await p.enviar({ projectId, prompt, mode: 'autonomo', excludedAgents: p.excluidos(), findingId: id }) // prettier-ignore
  await p.recargar()
  return desenlaceEnLote(antes, p.hallazgo(id))
}

/**
 * La cola del lote (ADR-088): un turno con foco por hallazgo, EN ORDEN, cada uno
 * esperado entero antes de lanzar el siguiente. Reusa las piezas 2 a 4 tal cual:
 * cada turno lleva su memoria y cierra su propio ciclo.
 *
 * No para por un desenlace: cada hallazgo es independiente. La cortan Detener y
 * salir de autonomo. Solo arranca en autonomo y si no hay otro lote corriendo;
 * si no arranca, devuelve null y no cuenta nada.
 */
export async function correrLote(
  projectId: string,
  ids: readonly string[],
  p: PuertosDeLaCola
): Promise<readonly DesenlaceEnLote[] | null> {
  if (ids.length === 0 || p.modo() !== 'autonomo' || p.cola.ocupada()) return null
  p.cola.arrancar(ids.length)
  const desenlaces: DesenlaceEnLote[] = []
  try {
    for (const id of ids) {
      if (p.cola.cortado() || p.modo() !== 'autonomo') break
      desenlaces.push(await turno(projectId, id, p))
      p.cola.avanzar()
    }
  } finally {
    p.cola.terminar()
    await p.contar(resumenDelLote(desenlaces, ids.length))
  }
  return desenlaces
}
