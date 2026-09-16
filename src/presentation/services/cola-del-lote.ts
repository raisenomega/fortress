import type { SendMessageInput } from '@application/chat/send-message-types'
import type { AgentId } from '@domain/agent/agent'
import { resumenDelLote, type DesenlaceEnLote } from '@domain/chat/desenlace-del-lote'
import type { Finding } from '@domain/project/finding'
import type { OperationMode } from '@domain/settings/operation-mode'
import { turnoDelLote } from './turno-del-lote'

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

/**
 * La cola del lote (ADR-088): un turno con foco por hallazgo, EN ORDEN, cada uno
 * esperado entero antes de lanzar el siguiente. Reusa las piezas 2 a 4 tal cual:
 * cada turno lleva su memoria y cierra su propio ciclo.
 *
 * No para por un desenlace: cada hallazgo es independiente. La corta Detener, y
 * solo eso: una vez aprobado el plan, cambiar de modo no deshace la aprobacion.
 *
 * NO arranca en autonomo: alli el plan lo aprueba OMEGA, que llega con la pieza
 * 5. Tampoco con otro lote o un turno en marcha. Si no arranca, devuelve null.
 */
export async function correrLote(
  projectId: string,
  ids: readonly string[],
  p: PuertosDeLaCola
): Promise<readonly DesenlaceEnLote[] | null> {
  if (ids.length === 0 || p.modo() === 'autonomo' || p.cola.ocupada()) return null
  p.cola.arrancar(ids.length)
  const desenlaces: DesenlaceEnLote[] = []
  try {
    for (const id of ids) {
      if (p.cola.cortado()) break
      desenlaces.push(await turnoDelLote(projectId, id, ids, p))
      p.cola.avanzar()
    }
  } finally {
    p.cola.terminar()
    await p.contar(resumenDelLote(desenlaces, ids.length))
  }
  return desenlaces
}
