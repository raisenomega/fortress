import type { Db } from './database'
import { addCarpetas } from './add-carpetas'
import { expandChatMessagesHilo } from './expand-chat-messages-hilo'
import { expandChatsModoCto } from './expand-chats-modo'
import { CHAT_MESSAGES_INDEXES } from './schema-chat-messages'

/**
 * La familia del chat, en su orden: B0 (el recambio del multi-chat), sus
 * indices —aqui y no en el esquema base: sobre una tabla vieja explotaban al
 * arrancar—, carpetas (ALTER aditivo del 114) y el CHECK de modos con 'cto'
 * (PASO 124) — otro recambio, y va TRAS carpetas para que toda base llegue
 * con carpeta_id a la copia por nombre (la leccion de usage_known).
 */
export function migrarElChat(db: Db): void {
  expandChatMessagesHilo(db)
  db.exec(CHAT_MESSAGES_INDEXES)
  addCarpetas(db)
  expandChatsModoCto(db)
}
