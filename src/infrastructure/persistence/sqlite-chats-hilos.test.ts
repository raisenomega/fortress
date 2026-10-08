import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { SCHEMA } from './schema'
import { createSqliteChatRepository } from './sqlite-chat-repository'

/** PASO 104 B0: el repo multi-hilo sobre el esquema REAL. El legado (chat_id
 *  NULL) se lee aparte de los hilos nuevos — sin mezclar, sin backfill. */

let db: Database.Database
let repo: ReturnType<typeof createSqliteChatRepository>
const legado = (id: string, pid: string): void =>
  void db.prepare("INSERT INTO chat_messages (id, project_id, role, content, mode, created_at) VALUES (?, ?, 'user', 'viejo', 'supervisado', '2026-09-01')").run(id, pid) // prettier-ignore

beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)
  db.prepare("INSERT INTO projects (id, name, path, created_at) VALUES ('p1','Uno','/tmp/p1','2026-09-01')").run() // prettier-ignore
  repo = createSqliteChatRepository(db as never)
})

describe('el repo multi-hilo', () => {
  it('crea un hilo (con proyecto o SIN el: el libre) y lo lista', () => {
    const conRepo = repo.createChat({ projectId: 'p1', titulo: 'Plan X', modo: 'plan' })
    const libre = repo.createChat({ projectId: null, titulo: 'Libre', modo: 'libre' })
    expect(repo.listChats('p1').map((c) => c.id)).toEqual([conRepo.id])
    expect(repo.listChats(null).map((c) => c.id)).toEqual([libre.id])
    expect(libre.projectId).toBeNull()
  })

  it('addToChat cuelga el mensaje del hilo (hereda su proyecto) y listByChat lo lee', () => {
    const hilo = repo.createChat({ projectId: 'p1', titulo: 'T', modo: 'investigacion' })
    const msg = repo.addToChat(hilo.id, { role: 'user', content: 'hola', agentId: null, mode: 'supervisado', engine: 'claude-code' }) // prettier-ignore
    expect(msg.chatId).toBe(hilo.id)
    expect(repo.listByChat(hilo.id).map((m) => m.content)).toEqual(['hola'])
  })

  it('listByProject es SOLO el hilo LEGADO: lo nuevo no se cuela', () => {
    legado('m1', 'p1')
    const hilo = repo.createChat({ projectId: 'p1', titulo: 'T', modo: 'plan' })
    repo.addToChat(hilo.id, { role: 'user', content: 'nuevo', agentId: null, mode: 'supervisado', engine: 'api' }) // prettier-ignore
    expect(repo.listByProject('p1').map((m) => m.content)).toEqual(['viejo'])
    expect(repo.listByChat(hilo.id).map((m) => m.content)).toEqual(['nuevo'])
  })
})
