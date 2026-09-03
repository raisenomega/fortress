/**
 * Tablas del propio FORTRESS (no de un proyecto): no cuelgan de projects ni
 * cascadean al borrar uno. Aparte de schema.ts solo para no pasar de 75 lineas.
 * Idempotentes: se aplican en cada arranque sin duplicar nada.
 *
 * `self_observations` estuvo en el esquema base hasta el 2026-09-03, sola y
 * lejos de las cuatro tablas del mismo subsistema. Vino aqui cuando hizo falta
 * sitio para darle estado: la asimetria no molestaba hasta que la tabla tuvo
 * que crecer y su fichero estaba lleno.
 */
export const SYSTEM_SCHEMA = `
CREATE TABLE IF NOT EXISTS self_observations (
  id TEXT PRIMARY KEY, source_project TEXT NOT NULL, kind TEXT NOT NULL,
  area TEXT NOT NULL, note TEXT NOT NULL, resolved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  -- resolved sobrevive por la regla de no borrar columnas (ADR-036), pero ya no
  -- lo lee nadie: quien manda es status, que ademas dice quien y por que.
  status TEXT NOT NULL DEFAULT 'pendiente', reason TEXT,
  attended_by TEXT, attended_at TEXT
);

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

CREATE TABLE IF NOT EXISTS capability_episodes (
  id            TEXT PRIMARY KEY,
  capability_id TEXT NOT NULL,
  outcome       TEXT NOT NULL,
  summary       TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cap_episodes ON capability_episodes (capability_id, created_at);
`
