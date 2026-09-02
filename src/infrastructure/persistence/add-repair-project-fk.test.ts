import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { addRepairProjectFk } from './add-repair-project-fk'
import { SIN_FK } from './add-repair-project-fk-fixture'

let db: Database.Database
const ids = (tabla: string): string[] =>
  (db.prepare(`SELECT id FROM ${tabla} ORDER BY id`).all() as { id: string }[]).map((f) => f.id)

beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(SIN_FK)
  addRepairProjectFk(db)
})

describe('addRepairProjectFk: colgar las dos tablas de su proyecto', () => {
  it('deja las claves foraneas encendidas y sin violaciones', () => {
    // El PRAGMA se apaga durante el recambio; si no se restaura, el siguiente
    // borrado de proyecto volveria a dejar propuestas huerfanas e invisibles.
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1)
    expect(db.pragma('foreign_key_check', { simple: true })).toBeUndefined()
  })

  it('conserva las filas legitimas de las dos tablas', () => {
    expect(ids('repair_proposals')).toEqual(['p-otro', 'p-viva'])
    expect(ids('quality_scans')).toEqual(['q-vivo'])
    expect(ids('proposal_events')).toEqual(['e1', 'e2'])
  })

  it('borra la huerfana con sus eventos, y NO toca el Libro', () => {
    // Los dos eventos caen con ella: al reves quedarian colgando de una
    // propuesta que ya no existe, cambiando una huerfana por dos.
    expect(ids('omega_log')).toEqual(['o1'])
    expect(db.prepare('SELECT COUNT(*) c FROM omega_log WHERE project_id = ?').get('muerto')).toEqual({ c: 1 }) // prettier-ignore
  })

  it('borrar un proyecto arrastra sus propuestas y encadena a sus eventos', () => {
    db.prepare('DELETE FROM projects WHERE id = ?').run('vivo')

    expect(ids('repair_proposals')).toEqual(['p-otro'])
    expect(ids('proposal_events')).toEqual(['e2'])
  })

  it('borrar un proyecto arrastra sus auditorias de calidad', () => {
    db.prepare('DELETE FROM projects WHERE id = ?').run('vivo')

    expect(ids('quality_scans')).toEqual([])
  })

  it('los indices sobreviven al recambio', () => {
    const sql = 'SELECT name FROM sqlite_master WHERE type = ? AND tbl_name = ?'
    const idx = db.prepare(sql).all('index', 'repair_proposals') as { name: string }[]
    expect(idx.map((i) => i.name)).toEqual(
      expect.arrayContaining(['idx_repair_proposals_unica', 'idx_repair_proposals_estado'])
    )
  })

  it('correrla dos veces no toca nada la segunda', () => {
    addRepairProjectFk(db)

    expect(ids('repair_proposals')).toEqual(['p-otro', 'p-viva'])
    expect(ids('proposal_events')).toEqual(['e1', 'e2'])
  })
})
