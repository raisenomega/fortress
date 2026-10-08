import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { SCHEMA } from './schema'
import { createSqliteChatRepository } from './sqlite-chat-repository'

/** PASO 114: gestion de hilos del organizador — mover, renombrar, listar. */

let db: Database.Database
let repo: ReturnType<typeof createSqliteChatRepository>
beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)
  db.prepare("INSERT INTO projects (id, name, path, created_at) VALUES ('p1','Uno','/tmp/p1','2026-09-01')").run() // prettier-ignore
  repo = createSqliteChatRepository(db as never)
})

describe('pertenencia y listas', () => {
  it('el hilo nace suelto (carpeta_id NULL); con carpetaId nace DENTRO', () => {
    const suelto = repo.createChat({ projectId: null, titulo: 'S', modo: 'libre' })
    const c = repo.crearCarpeta('Trading')
    const dentro = repo.createChat({ projectId: null, titulo: 'D', modo: 'libre', carpetaId: c.id }) // prettier-ignore
    expect(suelto.carpetaId).toBeNull()
    expect(repo.listarHilosPorCarpeta(c.id).map((h) => h.id)).toEqual([dentro.id])
    expect(repo.listarHilosSueltos().map((h) => h.id)).toEqual([suelto.id])
  })

  it('listarHilosSueltos es SOLO libre: un hilo de repo-proyecto no se cuela', () => {
    repo.createChat({ projectId: 'p1', titulo: 'Plan', modo: 'plan' })
    const libre = repo.createChat({ projectId: null, titulo: 'L', modo: 'libre' })
    expect(repo.listarHilosSueltos().map((h) => h.id)).toEqual([libre.id])
  })

  it('moverHilo cambia de carpeta; mover a NULL = Sin carpeta', () => {
    const c = repo.crearCarpeta('A')
    const h = repo.createChat({ projectId: null, titulo: 'H', modo: 'libre' })
    repo.moverHilo(h.id, c.id)
    expect(repo.listarHilosPorCarpeta(c.id).map((x) => x.id)).toEqual([h.id])
    repo.moverHilo(h.id, null)
    expect(repo.listarHilosSueltos().map((x) => x.id)).toEqual([h.id])
  })
})

describe('renombrar y borrar', () => {
  it('renombrarHilo fija el titulo y RENAME MANDA: la actividad no lo pisa', () => {
    const h = repo.createChat({ projectId: null, titulo: 'auto de 40 letras', modo: 'libre' })
    repo.renombrarHilo(h.id, 'Mi nombre')
    repo.addToChat(h.id, { role: 'user', content: 'mas actividad', agentId: null, mode: 'supervisado', engine: 'claude-code' }) // prettier-ignore
    expect(repo.listarHilosSueltos().map((x) => x.titulo)).toEqual(['Mi nombre'])
  })

  it('borrar un hilo arrastra sus mensajes (CASCADE de B0), atomico', () => {
    const h = repo.createChat({ projectId: null, titulo: 'H', modo: 'libre' })
    repo.addToChat(h.id, { role: 'user', content: 'x', agentId: null, mode: 'supervisado', engine: 'claude-code' }) // prettier-ignore
    db.prepare('DELETE FROM chats WHERE id = ?').run(h.id)
    expect(db.prepare('SELECT COUNT(*) c FROM chat_messages').get()).toEqual({ c: 0 })
  })
})
