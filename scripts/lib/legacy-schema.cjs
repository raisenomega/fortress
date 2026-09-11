/**
 * El esquema ANTERIOR a fingerprint/status/scan_id: las cinco tablas del nucleo
 * tal y como las creo la primera version. Vive aparte de quien las siembra
 * porque ya son tres los trozos de base vieja —nucleo, motor y telemetria— y
 * cada uno se lee solo.
 */
const LEGACY_SCHEMA = `CREATE TABLE projects (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, path TEXT NOT NULL UNIQUE,
  stack TEXT NOT NULL DEFAULT '', git_remote TEXT, git_branch TEXT,
  fortress_score INTEGER NOT NULL DEFAULT 0, last_scan TEXT,
  has_claude INTEGER NOT NULL DEFAULT 0, has_graph INTEGER NOT NULL DEFAULT 0,
  has_fortress INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);

CREATE TABLE findings (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  title TEXT NOT NULL, file TEXT NOT NULL DEFAULT '', line INTEGER,
  created_at TEXT NOT NULL);

CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL, content TEXT NOT NULL, agent_id TEXT, mode TEXT NOT NULL,
  created_at TEXT NOT NULL);

CREATE TABLE loop_sessions (
  project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  active INTEGER NOT NULL DEFAULT 0, cycles_done INTEGER NOT NULL DEFAULT 0,
  recent_scores TEXT NOT NULL DEFAULT '[]', spent_baseline REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL);

CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);`

module.exports = { LEGACY_SCHEMA }
