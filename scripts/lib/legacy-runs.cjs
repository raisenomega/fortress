/**
 * El trozo de base legacy que le toca a la telemetria: `agent_runs` TAL COMO la
 * tiene hoy cualquiera que haya abierto FORTRESS desde el primer recambio —
 * dieciseis columnas, `usage_known` ya puesta por su ALTER, y un CHECK que aun
 * no conoce `sistema`.
 *
 * Sin esto la suite de migracion NO ejercitaba el recambio: el esquema base crea
 * la tabla ya con los cuatro `kind` y el guard corta antes de tocar nada. Esa
 * ceguera es justo la que dejo pasar un recambio de un solo uso, que habria
 * tumbado al arrancar la app de cualquier operador con version de hoy.
 */
const { withDb } = require('./findings-seed.cjs')

const LEGACY_RUNS = `
CREATE TABLE agent_runs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_id TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('chat', 'scan', 'repair')),
  duration_ms INTEGER NOT NULL DEFAULT 0, failed INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens INTEGER NOT NULL DEFAULT 0, cache_creation_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd REAL NOT NULL DEFAULT 0, num_turns INTEGER NOT NULL DEFAULT 0,
  edits INTEGER NOT NULL DEFAULT 0, tools TEXT NOT NULL DEFAULT '', at TEXT NOT NULL,
  usage_known INTEGER);
CREATE INDEX idx_runs_project ON agent_runs (project_id, at);
CREATE INDEX idx_runs_agent ON agent_runs (agent_id, at);

INSERT INTO agent_runs (id, project_id, agent_id, kind, cost_usd, at, usage_known)
  VALUES ('run-chat', 'viejo', 'code-reviewer', 'chat', 1.5, '2026-08-01', 1),
         ('run-scan', 'viejo', 'security-reviewer', 'scan', 3.25, '2026-08-02', NULL);
`

const writeLegacyRuns = (db) => db.exec(LEGACY_RUNS)

/** Que el segundo recambio corrio de verdad, y que no se llevo nada por delante. */
function checkRunsMigration(check) {
  withDb((db) => {
    const ddl = db.prepare("SELECT sql FROM sqlite_master WHERE name = 'agent_runs'").get().sql
    check('el CHECK admite el cuarto kind', ddl.includes("'sistema'"), ddl)

    const filas = db.prepare('SELECT id, kind, cost_usd, usage_known FROM agent_runs ORDER BY id').all() // prettier-ignore
    check('el recambio conserva las dos corridas', filas.length === 2, JSON.stringify(filas))
    check('con su factura intacta', filas[1]?.cost_usd === 3.25, JSON.stringify(filas))
    // Copiada por NOMBRE: si fuera por posicion, `usage_known` caeria en otro
    // hueco o reventaria por numero de columnas.
    check('y con su bandera en el sitio', filas[0]?.usage_known === 1, JSON.stringify(filas))

    // Por NOMBRE, no por numero: SQLite lista ademas su autoindex del PRIMARY
    // KEY, y contar filas afirmaria algo que no es lo que importa.
    const indices = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'agent_runs'").all().map((i) => i.name) // prettier-ignore
    check('los dos indices renacen con la tabla', indices.includes('idx_runs_project') && indices.includes('idx_runs_agent'), JSON.stringify(indices)) // prettier-ignore

    const ok = db.prepare("INSERT INTO agent_runs (id, project_id, kind, at) VALUES ('n', 'viejo', 'sistema', '2026-09-11')") // prettier-ignore
    check('y ya acepta una corrida de sistema', ok.run().changes === 1)
  })
}

module.exports = { writeLegacyRuns, checkRunsMigration }
