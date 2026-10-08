import Database from 'better-sqlite3'
import { SCHEMA } from '../../infrastructure/persistence/schema'
import { createSqliteChatRepository } from '../../infrastructure/persistence/sqlite-chat-repository'
import { useConstruirStore } from '../stores/construir-store'
import { _inyectarPuerto } from './hilo-activo'

/** Rig de B1: el cajon REAL (sqlite :memory: + repo de B0) inyectado como
 *  puerto, y el store a cero. Solo para tests — fidelidad hasta el CHECK. */
export function rigDelHilo(): Database.Database {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)
  db.prepare("INSERT INTO projects (id, name, path, created_at) VALUES ('p1','Uno','/tmp/p1','2026-10-08'),('p2','Dos','/tmp/p2','2026-10-08')").run() // prettier-ignore
  const r = createSqliteChatRepository(db as never)
  _inyectarPuerto({
    createHilo: async (n) => r.createChat(n),
    listHilos: async (p) => r.listChats(p),
    listByHilo: async (id) => r.listByChat(id),
    addToHilo: async (id, m) => r.addToChat(id, m)
  })
  useConstruirStore.setState({ messages: [], draft: null, hiloActivo: null })
  return db
}

export const filasDe = (
  db: Database.Database
): { role: string; content: string; chat_id: string }[] =>
  db.prepare('SELECT role, content, chat_id FROM chat_messages ORDER BY rowid').all() as never
