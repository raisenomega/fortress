import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { CHATS_SCHEMA } from './schema-chat-messages'
import { expandChatMessagesHilo } from './expand-chat-messages-hilo'

/** La forma VIEJA real (schema pre-B0): project_id NOT NULL, sin chat_id. */
const VIEJO = `
CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL, content TEXT NOT NULL, agent_id TEXT,
  mode TEXT NOT NULL, engine TEXT NOT NULL DEFAULT 'api', created_at TEXT NOT NULL
);
INSERT INTO projects VALUES ('p1','Uno'),('p2','Dos');
INSERT INTO chat_messages VALUES
  ('m1','p1','user','hola','', 'supervisado','api','2026-09-01'),
  ('m2','p1','assistant','que tal {"apiKey":"***"}',NULL,'supervisado','claude-code','2026-09-02'),
  ('m3','p2','user','otro proyecto',NULL,'autonomo','claude-code','2026-09-03');`

let db: Database.Database
beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(VIEJO)
  db.exec(CHATS_SCHEMA)
})

describe('expandChatMessagesHilo: NO-PERDIDA sobre el historial real', () => {
  it('conserva las N filas con su contenido EXACTO, y todas quedan legado (chat_id NULL)', () => {
    expandChatMessagesHilo(db)
    const filas = db.prepare('SELECT id, project_id, content, engine, chat_id FROM chat_messages ORDER BY id').all() // prettier-ignore
    expect(filas).toEqual([
      { id: 'm1', project_id: 'p1', content: 'hola', engine: 'api', chat_id: null },
      { id: 'm2', project_id: 'p1', content: 'que tal {"apiKey":"***"}', engine: 'claude-code', chat_id: null }, // prettier-ignore
      { id: 'm3', project_id: 'p2', content: 'otro proyecto', engine: 'claude-code', chat_id: null }
    ])
  })

  it('la forma nueva admite project_id NULL (el hilo libre) y chats tambien', () => {
    expandChatMessagesHilo(db)
    db.prepare("INSERT INTO chats VALUES ('c1', NULL, 'Libre', 'libre', '2026-10-08', '2026-10-08')").run() // prettier-ignore
    expect(() => db.prepare("INSERT INTO chat_messages (id, project_id, chat_id, role, content, mode, created_at) VALUES ('m4', NULL, 'c1', 'user', 'sin repo', 'supervisado', '2026-10-08')").run()).not.toThrow() // prettier-ignore
  })

  it('correrla dos veces no toca nada la segunda, y los indices renacen', () => {
    expandChatMessagesHilo(db)
    expandChatMessagesHilo(db)
    expect(db.prepare('SELECT COUNT(*) c FROM chat_messages').get()).toEqual({ c: 3 })
    const idx = (db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='chat_messages'").all() as { name: string }[]).map((i) => i.name) // prettier-ignore
    expect(idx).toEqual(expect.arrayContaining(['idx_chat_project', 'idx_chat_hilo']))
  })

  it('claves foraneas encendidas y sin violaciones al salir', () => {
    expandChatMessagesHilo(db)
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1)
    expect(db.pragma('foreign_key_check', { simple: true })).toBeUndefined()
  })

  it('el recambio va EN transaccion (pin a la invocacion, leccion del 96)', () => {
    expect(readFileSync('src/infrastructure/persistence/expand-chat-messages-hilo.ts', 'utf8')).toContain('db.transaction(') // prettier-ignore
  })
})
