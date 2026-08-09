import Database from 'better-sqlite3'
import type { Db } from './database'
import { runMigrations } from './migrations'
import { SCHEMA } from './schema'
import { CONNECTOR_SCHEMA } from './schema-connectors'
import { OMEGA_SCHEMA } from './schema-omega'
import { QUALITY_SCHEMA } from './schema-quality'
import { REPAIR_SCHEMA } from './schema-repair'
import { SYSTEM_SCHEMA } from './schema-system'
import { TELEMETRY_SCHEMA } from './schema-telemetry'

/**
 * Base REAL en memoria: mismo esquema y mismas migraciones que la del operador,
 * sin Electron y sin tocar disco. Permite probar el SQL de verdad —que es donde
 * vive la decision de conservar o borrar— sin esperar un escaneo de minutos.
 *
 * No la usa la app: su unico consumidor son las pruebas. Se queda junto al
 * esquema a proposito, para que anadir una tabla y olvidarla aqui rompa los
 * tests en vez de pasar desapercibido.
 */
export function createMemoryDb(): Db {
  const db = new Database(':memory:') as Db

  db.pragma('foreign_keys = ON')
  for (const schema of [
    SCHEMA,
    TELEMETRY_SCHEMA,
    CONNECTOR_SCHEMA,
    OMEGA_SCHEMA,
    SYSTEM_SCHEMA,
    QUALITY_SCHEMA,
    REPAIR_SCHEMA
  ]) {
    db.exec(schema)
  }
  runMigrations(db)
  return db
}

/** Un proyecto minimo al que colgar hallazgos. */
export function seedProject(db: Db, id: string): string {
  db.prepare("INSERT INTO projects (id, name, path, created_at) VALUES (?, 'FCC', '/tmp', ?)").run(
    id,
    '2026-08-01T00:00:00Z'
  )
  return id
}
