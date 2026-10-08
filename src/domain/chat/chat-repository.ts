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
}
