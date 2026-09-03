import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { addObservationStatus } from './add-observation-status'

let db: Database.Database

/** La tabla TAL COMO estaba: solo el booleano `resolved`, sin estado ni motivo. */
const VIEJA = `
CREATE TABLE self_observations (
  id TEXT PRIMARY KEY, source_project TEXT NOT NULL, kind TEXT NOT NULL,
  area TEXT NOT NULL, note TEXT NOT NULL, resolved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL);
INSERT INTO self_observations (id, source_project, kind, area, note, resolved, created_at)
  VALUES ('pendiente-vieja', 'p', 'gap', 'a', 'n', 0, '2026-08-01'),
         ('marcada-vieja',   'p', 'bug', 'b', 'n', 1, '2026-08-02');
`

const columnas = (): string[] =>
  (db.pragma('table_info(self_observations)') as { name: string }[]).map((c) => c.name)
const estado = (id: string): string =>
  (db.prepare('SELECT status FROM self_observations WHERE id = ?').get(id) as { status: string })
    .status

beforeEach(() => {
  db = new Database(':memory:')
  db.exec(VIEJA)
})

describe('addObservationStatus: de un booleano a tres estados', () => {
  it('anade las cuatro columnas sobre una base que no las tenia', () => {
    expect(columnas()).not.toContain('status')
    addObservationStatus(db)

    expect(columnas()).toEqual(expect.arrayContaining(['status', 'reason', 'attended_by', 'attended_at'])) // prettier-ignore
  })

  it('traduce lo que el estado viejo sabia: resolved=1 pasa a atendido', () => {
    addObservationStatus(db)

    expect(estado('marcada-vieja')).toBe('atendido')
    expect(estado('pendiente-vieja')).toBe('pendiente')
  })

  it('no pierde ni una fila ni un dato de las viejas', () => {
    addObservationStatus(db)
    const fila = db.prepare("SELECT * FROM self_observations WHERE id = 'marcada-vieja'").get()

    expect(db.prepare('SELECT COUNT(*) c FROM self_observations').get()).toEqual({ c: 2 })
    expect(fila).toMatchObject({ kind: 'bug', area: 'b', note: 'n', resolved: 1 })
  })

  it('correrla dos veces no rompe ni duplica columnas', () => {
    addObservationStatus(db)
    addObservationStatus(db)

    expect(columnas().filter((c) => c === 'status')).toHaveLength(1)
    expect(estado('marcada-vieja')).toBe('atendido')
  })

  it('el backfill NO pisa un estado que alguien ya cambio', () => {
    // Es lo que hace idempotente al UPDATE: sin el `AND status = pendiente`,
    // una segunda pasada resucitaria como atendida una descartada a mano.
    addObservationStatus(db)
    db.prepare(
      "UPDATE self_observations SET status = 'descartado' WHERE id = 'marcada-vieja'"
    ).run()
    addObservationStatus(db)

    expect(estado('marcada-vieja')).toBe('descartado')
  })
})
