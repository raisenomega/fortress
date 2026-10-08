import type { ChatMessage } from '@domain/chat/chat-message'
import type { MensajeDeHilo } from '@domain/chat/chat-repository'
import type { HiloDeChat, ModoDeChat, NuevoHilo } from '@domain/chat/hilo-de-chat'
import { newId, nowIso } from '@domain/shared/id'
import { toChatMessage, type ChatRow } from './chat-row'
import type { Db } from './database'

export interface HiloRow {
  readonly id: string
  readonly project_id: string | null
  readonly titulo: string
  readonly modo: string
  readonly carpeta_id: string | null
  readonly created_at: string
  readonly updated_at: string
}

export const aHilo = (r: HiloRow): HiloDeChat => ({
  id: r.id,
  projectId: r.project_id,
  titulo: r.titulo,
  modo: r.modo as ModoDeChat,
  carpetaId: r.carpeta_id,
  createdAt: r.created_at,
  updatedAt: r.updated_at
})

/** Las operaciones de HILOS (B0), aparte del repo de mensajes por el techo de
 *  lineas: misma familia, mismo puerto, dos modulos. */
export function hilosDeChat(
  db: Db
): Pick<
  import('@domain/chat/chat-repository').ChatRepository,
  'createChat' | 'listChats' | 'listByChat' | 'addToChat'
> {
  // prettier-ignore
  const insertar = db.prepare('INSERT INTO chats (id, project_id, titulo, modo, carpeta_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)') // prettier-ignore
  const porProyecto = db.prepare('SELECT * FROM chats WHERE project_id = ? ORDER BY updated_at DESC') // prettier-ignore
  const libres = db.prepare('SELECT * FROM chats WHERE project_id IS NULL ORDER BY updated_at DESC')
  const unHilo = db.prepare('SELECT * FROM chats WHERE id = ?')
  const tocar = db.prepare('UPDATE chats SET updated_at = ? WHERE id = ?')
  const mensajes = db.prepare('SELECT * FROM chat_messages WHERE chat_id = ? ORDER BY created_at ASC, rowid ASC') // prettier-ignore
  const insertarMsg = db.prepare('INSERT INTO chat_messages (id, project_id, chat_id, role, content, agent_id, mode, engine, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)') // prettier-ignore

  return {
    createChat: (nuevo: NuevoHilo): HiloDeChat => {
      const ahora = nowIso()
      const carpetaId = nuevo.carpetaId ?? null
      const hilo = { ...nuevo, carpetaId, id: newId(), createdAt: ahora, updatedAt: ahora }
      insertar.run(hilo.id, hilo.projectId, hilo.titulo, hilo.modo, carpetaId, ahora, ahora)
      return hilo
    },
    listChats: (projectId) =>
      ((projectId === null ? libres.all() : porProyecto.all(projectId)) as HiloRow[]).map(aHilo),
    listByChat: (chatId) => (mensajes.all(chatId) as ChatRow[]).map(toChatMessage),
    addToChat: (chatId, m: MensajeDeHilo): ChatMessage => {
      const hilo = unHilo.get(chatId) as HiloRow | undefined
      if (hilo === undefined) throw new Error(`hilo inexistente: ${chatId}`)
      const id = newId()
      const ahora = nowIso()
      insertarMsg.run(id, hilo.project_id, chatId, m.role, m.content, m.agentId, m.mode, m.engine, ahora) // prettier-ignore
      tocar.run(ahora, chatId)
      return { id, projectId: hilo.project_id ?? '', chatId, role: m.role, content: m.content, agentId: m.agentId, mode: m.mode, engine: m.engine, createdAt: ahora, pending: false } // prettier-ignore
    }
  }
}
