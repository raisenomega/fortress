/**
 * La base TAL COMO estaba antes de ampliar el CHECK: dos filas reales y los dos
 * indices. Es el punto de partida que la migracion tiene que dejar intacto.
 */
export const VIEJO = `
CREATE TABLE projects (id TEXT PRIMARY KEY);
CREATE TABLE agent_runs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_id TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('chat', 'scan')),
  duration_ms INTEGER NOT NULL DEFAULT 0, failed INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens INTEGER NOT NULL DEFAULT 0, cache_creation_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd REAL NOT NULL DEFAULT 0, num_turns INTEGER NOT NULL DEFAULT 0,
  edits INTEGER NOT NULL DEFAULT 0, tools TEXT NOT NULL DEFAULT '', at TEXT NOT NULL
);
CREATE INDEX idx_runs_project ON agent_runs (project_id, at);
CREATE INDEX idx_runs_agent ON agent_runs (agent_id, at);
INSERT INTO projects VALUES ('p1');
INSERT INTO agent_runs (id, project_id, agent_id, kind, cost_usd, at)
  VALUES ('r1', 'p1', 'security-reviewer', 'chat', 1.5, '2026-08-01'),
         ('r2', 'p1', 'security-reviewer', 'scan', 3.25, '2026-08-02');
` // prettier-ignore
