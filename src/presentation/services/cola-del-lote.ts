import type { SendMessageInput } from '@application/chat/send-message-types'
import type { AgentId } from '@domain/agent/agent'
import { resumenDelLote, type DesenlaceEnLote } from '@domain/chat/desenlace-del-lote'
import type { DesenlaceDelEnvio } from '@domain/chat/desenlace-del-envio'
import type { SinCierre } from '@domain/chat/motivo-sin-cierre'
import type { Finding } from '@domain/project/finding'
import { turnoDelLote } from './turno-del-lote'

/** Lo que la cola usa del mundo, inyectado: asi se prueba sin IPC ni React. */
export interface PuertosDeLaCola {
  readonly excluidos: () => readonly AgentId[]
  /** El hallazgo tal como esta ahora en el renderer; undefined si ya no esta vivo. */
  readonly hallazgo: (findingId: string) => Finding | undefined
  readonly abrirTerminal: () => void
  /** `sendMessage` de chat-service: se resuelve con el turno ENTERO, cierre
   *  incluido, y devuelve la guarda que corto ese cierre si corto alguna. */
  readonly enviar: (input: SendMessageInput) => Promise<DesenlaceDelEnvio>
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
 * Arranca en LOS DOS modos (ADR-090, Fase A.1c). En autonomo cada turno pasa por
 * OMEGA antes de conservar y reintenta hasta converger, asi que la cola ya no
 * necesita un aprobador por hallazgo: lo tiene dentro. No arranca con otro lote
 * o un turno en marcha —el carril del proyecto es uno—; entonces devuelve null.
 */
export async function correrLote(
  projectId: string,
  ids: readonly string[],
  p: PuertosDeLaCola
): Promise<readonly DesenlaceEnLote[] | null> {
  if (ids.length === 0 || p.cola.ocupada()) return null
  p.cola.arrancar(ids.length)
  const desenlaces: DesenlaceEnLote[] = []
  const motivos: SinCierre[] = []
  let sinVerificar = 0
  try {
    for (const id of ids) {
      if (p.cola.cortado()) break
      const turno = await turnoDelLote(projectId, id, ids, p)
      desenlaces.push(turno.desenlace)
      if (turno.sinCierre !== null) motivos.push(turno.sinCierre)
      if (turno.sinVerificar) sinVerificar += 1
      p.cola.avanzar()
    }
  } finally {
    p.cola.terminar()
    await p.contar(resumenDelLote(desenlaces, ids.length, motivos, sinVerificar))
  }
  return desenlaces
}
