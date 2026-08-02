/**
 * Base de datos con el esquema ANTERIOR a fingerprint/status/scan_id, tal y
 * como la tiene ahora mismo cualquiera que ya haya abierto FORTRESS. Sirve
 * para comprobar que las migraciones no rompen ni pierden datos: una app que
 * corrompe la base del operador en silencio es peor que una que no arranca.
 */
const { app } = require('electron')
const { join } = require('path')
const Database = require('better-sqlite3')

const LEGACY_SCHEMA = `
CREATE TABLE projects (
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

CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`

const AT = '2026-08-01T05:00:00.000Z'

/** Deja una base vieja con un proyecto, un hallazgo y un mensaje ya dentro. */
function writeLegacyDatabase() {
  const db = new Database(join(app.getPath('userData'), 'fortress.db'))

  try {
    db.exec(LEGACY_SCHEMA)
    db.prepare(
      `INSERT INTO projects (id, name, path, stack, git_remote, git_branch,
       fortress_score, last_scan, has_claude, created_at)
       VALUES ('viejo', 'Antiguo', '/tmp/antiguo', 'node', NULL, 'main', 64, ?, 1, ?)`
    ).run(AT, AT)

    db.prepare(
      `INSERT INTO findings (id, project_id, severity, title, file, line, created_at)
       VALUES ('h1', 'viejo', 'CRITICAL', 'SQL injection', 'api.js', 42, ?)`
    ).run(AT)

    db.prepare(
      `INSERT INTO chat_messages (id, project_id, role, content, agent_id, mode, created_at)
       VALUES ('m1', 'viejo', 'user', 'hola', NULL, 'supervisado', ?)`
    ).run(AT)
  } finally {
    db.close()
  }
}

module.exports = { writeLegacyDatabase }
