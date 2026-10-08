import type { Carpeta } from '@domain/chat/carpeta-de-chat'
import type { ChatMessage } from '@domain/chat/chat-message'
import type { MensajeDeHilo } from '@domain/chat/chat-repository'
import type { HiloDeChat, NuevoHilo } from '@domain/chat/hilo-de-chat'
import { api } from '../adapters/fortress-api'

/** El puerto de HILOS del renderer (split de hilo-activo por el techo de
 *  lineas — quinto de la familia chat). Async porque cruza el puente. */
export interface PuertoDeHilos {
  createHilo(n: NuevoHilo): Promise<HiloDeChat>
  listHilos(p: string | null): Promise<readonly HiloDeChat[]>
  listByHilo(id: string): Promise<readonly ChatMessage[]>
  addToHilo(id: string, m: MensajeDeHilo): Promise<ChatMessage>
  listarCarpetas(): Promise<readonly Carpeta[]>
  listarSueltos(): Promise<readonly HiloDeChat[]>
  borrarHilo(id: string): Promise<void>
  crearCarpeta(nombre: string): Promise<Carpeta>
  hilosPorCarpeta(carpetaId: string): Promise<readonly HiloDeChat[]>
  // La gestion del ⋯ (Revision B, PASO 121):
  renombrarHilo(id: string, titulo: string): Promise<void>
  moverHilo(id: string, carpetaId: string | null): Promise<void>
  renombrarCarpeta(id: string, nombre: string): Promise<void>
  /** 'mover' = SET NULL, no pierde hilos; 'con-hilos' = transaccion atomica. */
  borrarCarpeta(id: string, modo: 'mover' | 'con-hilos'): Promise<void>
}

let puerto: PuertoDeHilos | null = null
export const elPuerto = (): PuertoDeHilos => puerto ?? api().chat
/** SOLO tests: inyectar un puerto real en memoria (sqlite :memory:). */
export const _inyectarPuerto = (p: PuertoDeHilos | null): void => void (puerto = p)
