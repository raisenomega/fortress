/**
 * Base de datos con el esquema ANTERIOR a fingerprint/status/scan_id, tal y
 * como la tiene ahora mismo cualquiera que ya haya abierto FORTRESS. Sirve
 * para comprobar que las migraciones no rompen ni pierden datos: una app que
 * corrompe la base del operador en silencio es peor que una que no arranca.
 */
const { app } = require('electron')
const { join } = require('path')
const Database = require('better-sqlite3')
const { writeLegacyChats } = require('./legacy-chats.cjs')
const { writeLegacyRepair } = require('./legacy-repair.cjs')
const { writeLegacyRuns } = require('./legacy-runs.cjs')
const { LEGACY_SCHEMA } = require('./legacy-schema.cjs')
const { writeLegacyIdentidades } = require('./legacy-identidades.cjs')

const AT = '2026-08-01T05:00:00.000Z'

/** Deja una base vieja con un proyecto, un hallazgo y un mensaje ya dentro. */
function writeLegacyDatabase() {
  const db = new Database(join(app.getPath('userData'), 'fortress.db'))

  try {
    db.exec(LEGACY_SCHEMA)
    writeLegacyRepair(db)
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
      `INSERT INTO loop_sessions (project_id, active, cycles_done, recent_scores,
       spent_baseline, updated_at) VALUES ('viejo', 0, 2, '[100, 88]', 1.5, ?)`
    ).run(AT)

    db.prepare(
      `INSERT INTO chat_messages (id, project_id, role, content, agent_id, mode, created_at)
       VALUES ('m1', 'viejo', 'user', 'hola', NULL, 'supervisado', ?)`
    ).run(AT)

    // Los hilos del 104, con el CHECK de cinco modos: ejercitan el recambio.
    writeLegacyChats(db)

    // Los duplicados que el backfill de ADR-084 tiene que fundir al arrancar.
    writeLegacyIdentidades(db)

    // Va la ULTIMA: `agent_runs` si cuelga del proyecto, y sus filas necesitan
    // que 'viejo' ya exista.
    writeLegacyRuns(db)
  } finally {
    db.close()
  }
}

module.exports = { writeLegacyDatabase }
