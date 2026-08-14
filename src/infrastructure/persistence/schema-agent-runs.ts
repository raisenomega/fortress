/**
 * Las columnas de `agent_runs`, aparte para que la migracion que amplia el CHECK
 * recree la tabla desde ESTA definicion. Dos copias del mismo esquema acabarian
 * divergiendo, y el `INSERT ... SELECT *` del recambio depende de que el orden
 * de columnas sea identico.
 */
export const AGENT_RUNS_COLUMNS = `
  id                    TEXT PRIMARY KEY,
  project_id            TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_id              TEXT,
  kind                  TEXT NOT NULL CHECK (kind IN ('chat', 'scan', 'repair')),
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
`

export const AGENT_RUNS_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_runs_project ON agent_runs (project_id, at);
CREATE INDEX IF NOT EXISTS idx_runs_agent   ON agent_runs (agent_id, at);
`
