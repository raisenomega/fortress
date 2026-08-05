/**
 * Tablas del propio FORTRESS (no de un proyecto): no cuelgan de projects ni
 * cascadean al borrar uno. Aparte de schema.ts solo para no pasar de 75 lineas.
 * Idempotentes: se aplican en cada arranque sin duplicar nada.
 */
export const SYSTEM_SCHEMA = `
CREATE TABLE IF NOT EXISTS capabilities (
  id                 TEXT PRIMARY KEY,
  kind               TEXT NOT NULL,
  name               TEXT NOT NULL,
  origin_observation TEXT NOT NULL,
  phase              TEXT NOT NULL DEFAULT 'propuesta',
  created_at         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS capability_notes (
  id            TEXT PRIMARY KEY,
  capability_id TEXT NOT NULL,
  author        TEXT NOT NULL,
  note          TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cap_notes ON capability_notes (capability_id, created_at);

CREATE TABLE IF NOT EXISTS agent_definitions (
  capability_id TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  prompt        TEXT NOT NULL,
  icon_name     TEXT NOT NULL,
  active        INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);
`
