import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { expandChatsModoCto } from './expand-chats-modo'
import { TOCADA, VIEJO } from './expand-chats-modo-fixture'

let db: Database.Database
const meter = (modo: string): void =>
  void db.prepare("INSERT INTO chats (id, project_id, titulo, modo, created_at, updated_at) VALUES (?, NULL, 'Nuevo', ?, '2026-10-08', '2026-10-08')").run(`n-${modo}`, modo) // prettier-ignore

beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(VIEJO)
})

describe('expandChatsModoCto: abrir cto sin perder un hilo', () => {
  it('NO-PERDIDA: los cinco hilos EXACTOS en su orden y los mensajes intactos', () => {
    expandChatsModoCto(db)
    const hilos = db.prepare('SELECT id, modo, titulo FROM chats ORDER BY id').all() as { id: string; modo: string; titulo: string }[] // prettier-ignore
    expect(hilos.map((h) => `${h.id}:${h.modo}:${h.titulo}`)).toEqual([
      'c1:terminal:El Terminal', 'c2:libre:Charla libre', 'c3:plan:Un plan',
      'c4:investigacion:Una pesquisa', 'c5:ejecutor:Una obra'
    ]) // prettier-ignore
    expect(db.prepare('SELECT id, chat_id, content FROM chat_messages ORDER BY id').all()).toEqual([
      { id: 'm1', chat_id: null, content: 'legado del Terminal' },
      { id: 'm2', chat_id: 'c2', content: 'hola {"apiKey":"***"}' }
    ])
  })

  it("'cto' ENTRA: el CHECK viejo lo rechazaba, el nuevo lo admite", () => {
    expect(() => meter('cto')).toThrow()
    expandChatsModoCto(db)
    expect(() => meter('cto')).not.toThrow()
  })

  it("EL CHECK SIGUE GUARDANDO: 'xxx' fuera, los CINCO de siempre dentro", () => {
    expandChatsModoCto(db)
    expect(() => meter('xxx')).toThrow()
    for (const modo of ['terminal', 'libre', 'plan', 'investigacion', 'ejecutor'])
      expect(() => meter(modo)).not.toThrow()
  })

  it('IDEMPOTENTE: el segundo pase no toca nada y los indices renacen', () => {
    expandChatsModoCto(db)
    meter('cto')
    expandChatsModoCto(db)
    expect(db.prepare('SELECT COUNT(*) c FROM chats').get()).toEqual({ c: 6 })
    const idx = (db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'chats'").all() as { name: string }[]).map((i) => i.name) // prettier-ignore
    expect(idx).toEqual(expect.arrayContaining(['idx_chats_project', 'idx_chats_carpeta']))
  })
})

describe('la red del recambio: FK, reversion entera y el pin de la transaccion', () => {
  it('claves foraneas encendidas y sin violaciones al salir', () => {
    expandChatsModoCto(db)
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1)
    expect(db.pragma('foreign_key_check', { simple: true })).toBeUndefined()
  })

  it('la fila que el CHECK nuevo rechaza REVIERTE ENTERO: ni perdida ni residuo', () => {
    const rota = new Database(':memory:')
    rota.exec(TOCADA)
    expect(() => expandChatsModoCto(rota)).toThrow()
    expect(rota.prepare('SELECT COUNT(*) c FROM chats').get()).toEqual({ c: 2 })
    expect(rota.prepare("SELECT name FROM sqlite_master WHERE name = 'chats_nueva'").get()).toBeUndefined() // prettier-ignore
  })

  it('en transaccion y con el recuento DENTRO (pin a la invocacion, leccion del 96)', () => {
    const fuente = readFileSync('src/infrastructure/persistence/expand-chats-modo.ts', 'utf8')
    expect(fuente).toContain('db.transaction(')
    expect(fuente).toContain('se copiaron')
  })
})
