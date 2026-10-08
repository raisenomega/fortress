import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { SCHEMA } from './schema'
import { createSqliteChatRepository } from './sqlite-chat-repository'

/** PASO 114: carpetas del organizador de libre, sobre el esquema REAL. */

let db: Database.Database
let repo: ReturnType<typeof createSqliteChatRepository>
beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)
  db.exec('CREATE INDEX IF NOT EXISTS idx_chats_carpeta ON chats (carpeta_id, updated_at)')
  repo = createSqliteChatRepository(db as never)
})

describe('el ciclo de la carpeta', () => {
  it('crearCarpeta guarda la fila y listarCarpetas la devuelve', () => {
    const c = repo.crearCarpeta('Trading')
    expect(repo.listarCarpetas().map((x) => x.nombre)).toEqual(['Trading'])
    expect(c.instrucciones).toBe('')
  })

  it('renombrarCarpeta cambia el nombre', () => {
    const c = repo.crearCarpeta('Salud')
    repo.renombrarCarpeta(c.id, 'Salud y forma')
    expect(repo.listarCarpetas().map((x) => x.nombre)).toEqual(['Salud y forma'])
  })

  it('borrarCarpeta (por defecto) NO pierde hilos: quedan en Sin carpeta', () => {
    const c = repo.crearCarpeta('ERP')
    const h = repo.createChat({ projectId: null, titulo: 'H', modo: 'libre', carpetaId: c.id })
    repo.borrarCarpeta(c.id)
    expect(repo.listarCarpetas()).toEqual([])
    expect(repo.listarHilosSueltos().map((x) => x.id)).toEqual([h.id])
  })

  it('borrarCarpetaConHilos se lleva los hilos Y sus mensajes, atomico', () => {
    const c = repo.crearCarpeta('ERP')
    const h = repo.createChat({ projectId: null, titulo: 'H', modo: 'libre', carpetaId: c.id })
    repo.addToChat(h.id, { role: 'user', content: 'x', agentId: null, mode: 'supervisado', engine: 'claude-code' }) // prettier-ignore
    repo.borrarCarpetaConHilos(c.id)
    expect(repo.listarCarpetas()).toEqual([])
    expect(repo.listarHilosSueltos()).toEqual([])
    expect(db.prepare('SELECT COUNT(*) c FROM chat_messages').get()).toEqual({ c: 0 })
  })

  it('borrarCarpetaConHilos va EN transaccion (pin a la invocacion)', () => {
    expect(readFileSync('src/infrastructure/persistence/sqlite-carpetas.ts', 'utf8')).toContain('db.transaction(') // prettier-ignore
  })

  it('ningun borrado de carpetas toca el hilo LEGADO del Terminal', () => {
    db.prepare("INSERT INTO projects (id, name, path, created_at) VALUES ('p1','Uno','/tmp/p1','2026-09-01')").run() // prettier-ignore
    db.prepare("INSERT INTO chat_messages (id, project_id, role, content, mode, created_at) VALUES ('m1','p1','user','viejo','supervisado','2026-09-01')").run() // prettier-ignore
    const c = repo.crearCarpeta('ERP')
    repo.borrarCarpetaConHilos(c.id)
    expect(repo.listByProject('p1').map((m) => m.content)).toEqual(['viejo'])
  })
})
