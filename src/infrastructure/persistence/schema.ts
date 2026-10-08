import { CHATS_SCHEMA, CHAT_MESSAGES_COLUMNS } from './schema-chat-messages'

/**
 * Esquema de la base local. Idempotente: se ejecuta en cada arranque.
 * ON DELETE CASCADE garantiza que borrar un proyecto se lleva su historial.
 */
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  path           TEXT NOT NULL UNIQUE,
  stack          TEXT NOT NULL DEFAULT '',
  git_remote     TEXT,
  git_branch     TEXT,
  fortress_score INTEGER NOT NULL DEFAULT 0,
  general_quality INTEGER, quality_partial INTEGER, dim_seguridad INTEGER, dim_correctitud INTEGER,
  dim_tests INTEGER, dim_mantenibilidad INTEGER, dim_dependencias INTEGER, dim_operacion INTEGER,
  last_scan      TEXT,
  has_claude     INTEGER NOT NULL DEFAULT 0,
  has_graph      INTEGER NOT NULL DEFAULT 0,
  graph_nodes INTEGER, graph_edges INTEGER, graph_indexed_at TEXT,
  has_fortress   INTEGER NOT NULL DEFAULT 0,
  trusted        INTEGER NOT NULL DEFAULT 0,
  loop_enabled   INTEGER NOT NULL DEFAULT 0,
  config_state   TEXT NOT NULL DEFAULT 'CONFIGURADO',
  created_at     TEXT NOT NULL
);
${CHATS_SCHEMA}

CREATE TABLE IF NOT EXISTS chat_messages (${CHAT_MESSAGES_COLUMNS}
);

CREATE INDEX IF NOT EXISTS idx_chat_project
  ON chat_messages (project_id, created_at);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS findings (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  severity   TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  title      TEXT NOT NULL,
  file        TEXT NOT NULL DEFAULT '',
  line        INTEGER,
  fingerprint TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'open',
  scan_id     TEXT,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_findings_project
  ON findings (project_id);

CREATE TABLE IF NOT EXISTS loop_sessions (
  project_id     TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  active         INTEGER NOT NULL DEFAULT 0, cycles_done INTEGER NOT NULL DEFAULT 0,
  recent_scores  TEXT NOT NULL DEFAULT '[]',
  spent_baseline REAL NOT NULL DEFAULT 0,
  updated_at     TEXT NOT NULL,
  stopped_reason TEXT, stopped_reason_detail TEXT, stopped_at TEXT
);
`
