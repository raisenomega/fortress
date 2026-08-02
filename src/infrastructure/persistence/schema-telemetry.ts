/**
 * Tablas de observabilidad, separadas del esquema base solo para no pasar de
 * 75 lineas. Se aplican igual, en cada arranque y de forma idempotente.
 *
 * Todas cuelgan del proyecto con ON DELETE CASCADE: borrar un proyecto no
 * puede dejar telemetria huerfana contando tokens de algo que ya no existe.
 */
export const TELEMETRY_SCHEMA = `
CREATE TABLE IF NOT EXISTS agent_runs (
  id                    TEXT PRIMARY KEY,
  project_id            TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_id              TEXT,
  kind                  TEXT NOT NULL CHECK (kind IN ('chat', 'scan')),
  duration_ms           INTEGER NOT NULL DEFAULT 0,
  failed                INTEGER NOT NULL DEFAULT 0,
  input_tokens          INTEGER NOT NULL DEFAULT 0,
  output_tokens         INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens     INTEGER NOT NULL DEFAULT 0,
  cache_creation_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd              REAL    NOT NULL DEFAULT 0,
  num_turns             INTEGER NOT NULL DEFAULT 0,
  edits                 INTEGER NOT NULL DEFAULT 0,
  tools                 TEXT    NOT NULL DEFAULT '',
  at                    TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_runs_project ON agent_runs (project_id, at);
CREATE INDEX IF NOT EXISTS idx_runs_agent   ON agent_runs (agent_id, at);
`
