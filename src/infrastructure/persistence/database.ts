import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { runMigrations } from './migrations'
import { SCHEMA } from './schema'
import { CONNECTOR_SCHEMA } from './schema-connectors'
import { OMEGA_SCHEMA } from './schema-omega'
import { QUALITY_SCHEMA } from './schema-quality'
import { PROPOSAL_EVENTS_SCHEMA } from './schema-proposal-events'
import { REPAIR_SCHEMA } from './schema-repair'
import { ALIASES_SCHEMA } from './schema-aliases'
import { SIGHTINGS_SCHEMA } from './schema-sightings'
import { SYSTEM_SCHEMA } from './schema-system'
import { TELEMETRY_SCHEMA } from './schema-telemetry'

export type Db = Database.Database

let instance: Db | null = null

/** La base vive en userData: fuera del bundle y del repositorio. */
function databasePath(): string {
  return join(app.getPath('userData'), 'fortress.db')
}

function configure(db: Db): void {
  // WAL soporta lecturas concurrentes durante una escritura.
  db.pragma('journal_mode = WAL')
  // Sin esto SQLite ignora las claves foraneas y el CASCADE no borraria nada.
  db.pragma('foreign_keys = ON')
}

/** Abre la base (una sola vez por proceso) y aplica el esquema. */
export function getDatabase(): Db {
  if (instance) return instance

  const db = new Database(databasePath())
  configure(db)
  db.exec(SCHEMA)
  db.exec(TELEMETRY_SCHEMA)
  db.exec(CONNECTOR_SCHEMA)
  db.exec(OMEGA_SCHEMA)
  db.exec(SYSTEM_SCHEMA)
  db.exec(SIGHTINGS_SCHEMA)
  db.exec(ALIASES_SCHEMA)
  db.exec(QUALITY_SCHEMA)
  db.exec(REPAIR_SCHEMA)
  db.exec(PROPOSAL_EVENTS_SCHEMA)
  runMigrations(db)
  instance = db
  return db
}

export function closeDatabase(): void {
  instance?.close()
  instance = null
}
