import { describe, expect, it } from 'vitest'
import type { Db } from './database'
import { createMemoryDb, seedProject } from './memory-db'
import { runMigrations } from './migrations'
import { crearBench, PROYECTO, SIN_FACTURA, type Bench } from './cierre-partido-fixture'

/** La tabla tal y como la dejaba la version anterior a esta pieza: sin modelo. */
const PARADA_VIEJA = `CREATE TABLE scan_parada_runs (
  id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parada_indice INTEGER NOT NULL, parada_rotulo TEXT NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0, input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0, cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  cache_creation_tokens INTEGER NOT NULL DEFAULT 0, cost_usd REAL NOT NULL DEFAULT 0,
  num_turns INTEGER NOT NULL DEFAULT 0, at TEXT NOT NULL
)`

const columnas = (db: Db): readonly string[] =>
  (db.pragma('table_info(scan_parada_runs)') as { name: string }[]).map((c) => c.name)
/** Base con la tabla de ANTES y una fila dentro, molde `baseConScanViejo`. */
function baseConParadaVieja(): Db {
  const db = createMemoryDb()
  seedProject(db, PROYECTO)
  db.exec(`INSERT INTO scans (id, project_id, score, at) VALUES ('s1', '${PROYECTO}', 0, 't')`)
  db.exec('DROP TABLE scan_parada_runs')
  db.exec(PARADA_VIEJA)
  db.exec(`INSERT INTO scan_parada_runs (id, scan_id, project_id, parada_indice, parada_rotulo, at) VALUES ('pr-vieja', 's1', '${PROYECTO}', 1, 'src', 't')`) // prettier-ignore
  return db
}

function grabada(bench: Bench, modelo?: string): Record<string, unknown> {
  const abierto = bench.context.scans.abrir({ projectId: PROYECTO, startedAt: 't', paradasTotal: 1, ficherosTotal: null }) // prettier-ignore
  bench.context.paradaRuns.record({
    scanId: abierto.id, projectId: PROYECTO, paradaIndice: 1, paradaRotulo: 'src',
    durationMs: 9, usage: SIN_FACTURA, at: 't', ...(modelo === undefined ? {} : { modelo })
  }) // prettier-ignore
  return bench.context.paradaRuns.listByScan(abierto.id)[0] as unknown as Record<string, unknown>
}

describe('la fila de la parada lleva el modelo que corrio', () => {
  it('lo guarda y lo devuelve', () => {
    expect(grabada(crearBench(), 'claude-opus-5-5').modelo).toBe('claude-opus-5-5')
  })

  it('candado: sin modelo, la columna queda NULL — no se inventa', () => {
    const bench = crearBench()
    expect(grabada(bench).modelo).toBeUndefined()
    const cruda = bench.db.prepare('SELECT modelo FROM scan_parada_runs').get() as { modelo: unknown } // prettier-ignore
    expect(cruda.modelo).toBeNull()
  })
})

describe('la base vieja gana la columna al migrar', () => {
  it('la tabla de antes no la tiene; tras migrar existe y la fila vieja queda NULL', () => {
    const db = baseConParadaVieja()
    expect(columnas(db)).not.toContain('modelo')

    runMigrations(db)

    expect(columnas(db)).toContain('modelo')
    const vieja = db.prepare("SELECT modelo FROM scan_parada_runs WHERE id = 'pr-vieja'").get() as { modelo: unknown } // prettier-ignore
    // NULL es «anterior a la pieza»: clasificarla seria inferir (sin backfill).
    expect(vieja.modelo).toBeNull()
  })

  it('es idempotente: dos pasadas, ni error ni columna duplicada', () => {
    const db = baseConParadaVieja()

    runMigrations(db)
    expect(() => runMigrations(db)).not.toThrow()

    expect(columnas(db).filter((c) => c === 'modelo')).toHaveLength(1)
  })
})
