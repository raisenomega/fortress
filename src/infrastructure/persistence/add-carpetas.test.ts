import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { CARPETAS_SCHEMA } from './schema-chat-messages'
import { addCarpetas } from './add-carpetas'

/** La forma de chats SIN carpeta (B0 tal cual): asi llega toda base viva. */
const VIEJO = `
CREATE TABLE chats (
  id TEXT PRIMARY KEY, project_id TEXT, titulo TEXT NOT NULL,
  modo TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
INSERT INTO chats VALUES
  ('h1', NULL, 'Libre', 'libre', '2026-10-01', '2026-10-01'),
  ('h2', 'p1', 'Plan', 'plan', '2026-10-02', '2026-10-02');`

let db: Database.Database
beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(VIEJO)
  db.exec(CARPETAS_SCHEMA) // el esquema base corre antes que las migraciones
})

describe('addCarpetas: la columna aditiva sobre la base viva', () => {
  it('anade carpeta_id (NULL = suelto) y el indice, sin tocar los hilos', () => {
    addCarpetas(db)
    const filas = db.prepare('SELECT id, titulo, carpeta_id FROM chats ORDER BY id').all()
    expect(filas).toEqual([
      { id: 'h1', titulo: 'Libre', carpeta_id: null },
      { id: 'h2', titulo: 'Plan', carpeta_id: null }
    ])
    const idx = (db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='chats'").all() as { name: string }[]).map((i) => i.name) // prettier-ignore
    expect(idx).toContain('idx_chats_carpeta')
  })

  it('doble pase inofensivo (guard de idempotencia)', () => {
    addCarpetas(db)
    expect(() => addCarpetas(db)).not.toThrow()
    expect(db.prepare('SELECT COUNT(*) c FROM chats').get()).toEqual({ c: 2 })
  })

  it('sobre la base MIGRADA, borrar la carpeta mueve sus hilos a NULL (SET NULL)', () => {
    addCarpetas(db)
    db.prepare("INSERT INTO carpetas VALUES ('c1','Trading','','2026-10-08','2026-10-08')").run()
    db.prepare("UPDATE chats SET carpeta_id = 'c1' WHERE id = 'h1'").run()
    db.prepare("DELETE FROM carpetas WHERE id = 'c1'").run()
    expect(db.prepare("SELECT carpeta_id FROM chats WHERE id = 'h1'").get()).toEqual({ carpeta_id: null }) // prettier-ignore
  })

  it('el ALTER va ANTES del indice en el fuente (la leccion del 104)', () => {
    const src = readFileSync('src/infrastructure/persistence/add-carpetas.ts', 'utf8')
    expect(src.indexOf('ADD COLUMN carpeta_id')).toBeLessThan(src.indexOf('idx_chats_carpeta'))
    expect(src.indexOf('ADD COLUMN carpeta_id')).toBeGreaterThan(-1)
  })

  it('REGLA DE HIERRO: carpetas no tiene donde atar un repo (pin de esquema)', () => {
    const cols = (db.pragma('table_info(carpetas)') as { name: string }[]).map((c) => c.name)
    expect(cols).toEqual(['id', 'nombre', 'instrucciones', 'created_at', 'updated_at'])
  })
})
