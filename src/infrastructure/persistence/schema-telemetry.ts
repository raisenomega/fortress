/**
 * Tablas de observabilidad, separadas del esquema base solo para no pasar de
 * 75 lineas. Se aplican igual, en cada arranque y de forma idempotente.
 *
 * Todas cuelgan del proyecto con ON DELETE CASCADE: borrar un proyecto no
 * puede dejar telemetria huerfana contando tokens de algo que ya no existe.
 */
import { AGENT_RUNS_COLUMNS, AGENT_RUNS_INDEXES } from './schema-agent-runs'

export const TELEMETRY_SCHEMA = `
CREATE TABLE IF NOT EXISTS agent_runs (${AGENT_RUNS_COLUMNS});
${AGENT_RUNS_INDEXES}

CREATE TABLE IF NOT EXISTS scans (
  id             TEXT PRIMARY KEY,
  project_id     TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  score          INTEGER NOT NULL,
  finding_count  INTEGER NOT NULL DEFAULT 0,
  dossier_count  INTEGER NOT NULL DEFAULT 0,
  critical_count INTEGER NOT NULL DEFAULT 0,
  duration_ms    INTEGER NOT NULL DEFAULT 0,
  at             TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scans_project ON scans (project_id, at);

-- El descarte sobrevive al escaneo que lo origino: las filas de findings se
-- sustituyen enteras en cada escaneo, asi que la decision del operador tiene
-- que vivir aparte o duraria hasta el siguiente scan.
CREATE TABLE IF NOT EXISTS activity (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_id   TEXT,
  kind       TEXT NOT NULL,
  summary    TEXT NOT NULL,
  severity   TEXT,
  file       TEXT NOT NULL DEFAULT '',
  line       INTEGER,
  at         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_project ON activity (project_id, at);
CREATE INDEX IF NOT EXISTS idx_activity_agent   ON activity (agent_id, at);

CREATE TABLE IF NOT EXISTS dismissals (
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  at          TEXT NOT NULL,
  PRIMARY KEY (project_id, fingerprint)
);
`
