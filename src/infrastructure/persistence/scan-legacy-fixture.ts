import type { Db } from './database'
import { createMemoryDb, seedProject } from './memory-db'

export const PROYECTO = 'p1'

/** `scans` tal y como la dejaba la version anterior a ADR-082: ocho columnas. */
const SCANS_VIEJA = `CREATE TABLE scans (
  id             TEXT PRIMARY KEY,
  project_id     TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  score          INTEGER NOT NULL,
  finding_count  INTEGER NOT NULL DEFAULT 0,
  dossier_count  INTEGER NOT NULL DEFAULT 0,
  critical_count INTEGER NOT NULL DEFAULT 0,
  duration_ms    INTEGER NOT NULL DEFAULT 0,
  at             TEXT NOT NULL
)`

/** La fila que ya estaba ahi, con su score de verdad. */
export const VIEJA = {
  id: 'scan-viejo',
  score: 27,
  findingCount: 9,
  dossierCount: 9,
  criticalCount: 2,
  durationMs: 492307,
  at: '2026-09-08T01:40:31.903Z'
} as const

/**
 * Una base con la tabla `scans` de ANTES y una fila dentro, sin las columnas
 * del recorrido. Se reconstruye la tabla a mano porque el esquema vivo ya las
 * trae: sin este paso el test probaria la migracion contra una tabla que ya
 * estaba migrada, que es no probar nada.
 */
export function baseConScanViejo(): Db {
  const db = createMemoryDb()
  seedProject(db, PROYECTO)
  db.exec('DROP TABLE scans')
  db.exec(SCANS_VIEJA)
  db.prepare(
    `INSERT INTO scans (id, project_id, score, finding_count, dossier_count,
       critical_count, duration_ms, at)
     VALUES (@id, '${PROYECTO}', @score, @findingCount, @dossierCount,
       @criticalCount, @durationMs, @at)`
  ).run(VIEJA)
  return db
}

/** Las columnas que tiene la tabla ahora mismo, para afirmar sobre el esquema. */
export function columnasDeScans(db: Db): readonly string[] {
  return (db.pragma('table_info(scans)') as { name: string }[]).map((c) => c.name)
}
