import type { Carpeta } from './carpeta-de-chat'
import type { ChatMessage, NewChatMessage } from './chat-message'
import type { HiloDeChat, NuevoHilo } from './hilo-de-chat'

/** Lo que cuelga de un hilo: el proyecto lo hereda del hilo, no viaja aqui. */
export type MensajeDeHilo = Omit<NewChatMessage, 'projectId'>

/**
 * Puerto de persistencia del chat (multi-hilo desde B0). `listByProject` y
 * `add` son el hilo LEGADO —chat_id NULL, uno por proyecto, el Terminal de
 * siempre—; los hilos nuevos van por `createChat`/`addToChat`/`listByChat`.
 */
export interface ChatRepository {
  listByProject(projectId: string): readonly ChatMessage[]
  add(message: NewChatMessage): ChatMessage
  clearProject(projectId: string): void
  createChat(nuevo: NuevoHilo): HiloDeChat
  /** Los hilos del proyecto, o los LIBRES (sin proyecto) con `null`. */
  listChats(projectId: string | null): readonly HiloDeChat[]
  listByChat(chatId: string): readonly ChatMessage[]
  addToChat(chatId: string, mensaje: MensajeDeHilo): ChatMessage
  crearCarpeta(nombre: string): Carpeta
  listarCarpetas(): readonly Carpeta[]
  renombrarCarpeta(id: string, nombre: string): void
  /** Por defecto NO pierde hilos: el esquema (SET NULL) los deja sueltos. */
  borrarCarpeta(id: string): void
  /** El borrado elegido a proposito: hilos + mensajes + carpeta, atomico. */
  borrarCarpetaConHilos(id: string): void
  moverHilo(hiloId: string, carpetaId: string | null): void
  /** RENAME MANDA: el titulo a mano no lo pisa ninguna actividad posterior. */
  renombrarHilo(hiloId: string, titulo: string): void
  listarHilosPorCarpeta(carpetaId: string): readonly HiloDeChat[]
  /** Los libres SIN carpeta: jamas mezcla repo-proyectos ni legado. */
  listarHilosSueltos(): readonly HiloDeChat[]
}
