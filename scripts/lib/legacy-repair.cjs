/**
 * El trozo de base legacy que le toca al motor de reparacion: `repair_proposals`
 * y `quality_scans` TAL COMO estaban, con un `project_id` suelto y sin clave
 * foranea. Sin esto la suite de migracion no ejercitaria el recambio, porque el
 * esquema base crea las dos tablas ya colgadas y la migracion se saltaria sola.
 *
 * Siembra lo legitimo y lo huerfano: un proyecto borrado dejo atras una
 * propuesta con dos eventos, una auditoria y un asiento en el Libro. Al arrancar,
 * lo huerfano debe irse y lo legitimo quedarse — y el Libro no se toca.
 */
const { withDb } = require('./findings-seed.cjs')

const LEGACY_REPAIR = `
CREATE TABLE repair_proposals (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL, finding_id TEXT NOT NULL,
  base_sha TEXT NOT NULL, state TEXT NOT NULL, analysis_verdict TEXT,
  analysis_reason TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE quality_scans (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL, global INTEGER NOT NULL,
  partial INTEGER NOT NULL, dim_seguridad INTEGER, dim_correctitud INTEGER,
  dim_tests INTEGER, dim_mantenibilidad INTEGER, dim_dependencias INTEGER,
  dim_operacion INTEGER, at TEXT NOT NULL);
CREATE TABLE proposal_events (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL REFERENCES repair_proposals(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL, phase TEXT NOT NULL, event_type TEXT NOT NULL,
  from_state TEXT, to_state TEXT, actor TEXT NOT NULL, agent_run_id TEXT,
  scan_id TEXT, reason TEXT, cost_tokens INTEGER, duration_ms INTEGER,
  evidence_json TEXT, ts INTEGER NOT NULL, UNIQUE(proposal_id, seq));
CREATE TABLE omega_log (
  id TEXT PRIMARY KEY, at TEXT NOT NULL, project_id TEXT, agent_id TEXT,
  kind TEXT NOT NULL, verdict TEXT NOT NULL, summary TEXT NOT NULL,
  evidence TEXT NOT NULL DEFAULT '');

INSERT INTO repair_proposals (id, project_id, finding_id, base_sha, state, created_at, updated_at)
  VALUES ('rp-viva', 'viejo', 'h1', 'sha', 'ANALIZADO', 1, 1),
         ('rp-huerfana', 'borrado', 'h9', 'sha', 'ANALIZADO', 2, 2);
INSERT INTO quality_scans (id, project_id, global, partial, at)
  VALUES ('qs-viva', 'viejo', 77, 0, '2026-08-01'),
         ('qs-huerfana', 'borrado', 84, 0, '2026-08-02');
INSERT INTO proposal_events (id, proposal_id, seq, phase, event_type, actor, ts)
  VALUES ('pe-v1', 'rp-viva', 1, 'SELECT', 'TRANSITION', 'motor', 1),
         ('pe-h1', 'rp-huerfana', 1, 'SELECT', 'TRANSITION', 'motor', 2),
         ('pe-h2', 'rp-huerfana', 2, 'ANALYZE', 'TRANSITION', 'motor', 3);
INSERT INTO omega_log (id, at, project_id, kind, verdict, summary)
  VALUES ('ol-1', '2026-08-02', 'borrado', 'nota', 'info', 'el Libro sobrevive');
`

const writeLegacyRepair = (db) => db.exec(LEGACY_REPAIR)

const cuenta = (db, tabla, donde) =>
  db.prepare(`SELECT COUNT(*) AS n FROM ${tabla} WHERE ${donde}`).get().n

/** Que la migracion corrio de verdad al arrancar la app sobre la base vieja. */
function checkRepairMigration(check) {
  withDb((db) => {
    check('conserva la propuesta legitima', cuenta(db, 'repair_proposals', "id = 'rp-viva'") === 1)
    check('limpia la propuesta huerfana', cuenta(db, 'repair_proposals', "id = 'rp-huerfana'") === 0) // prettier-ignore
    check('sus eventos caen con ella, no quedan colgando', cuenta(db, 'proposal_events', "proposal_id = 'rp-huerfana'") === 0) // prettier-ignore
    check('el libro de la legitima queda intacto', cuenta(db, 'proposal_events', "proposal_id = 'rp-viva'") === 1) // prettier-ignore
    check('limpia la auditoria huerfana', cuenta(db, 'quality_scans', "id = 'qs-huerfana'") === 0)
    check('conserva la auditoria legitima', cuenta(db, 'quality_scans', "id = 'qs-viva'") === 1)
    check('el Libro NO se toca: omega_log conserva su asiento', cuenta(db, 'omega_log', "project_id = 'borrado'") === 1) // prettier-ignore
    check('sin violaciones de clave foranea', db.pragma('foreign_key_check', { simple: true }) === undefined) // prettier-ignore
  })
}

module.exports = { writeLegacyRepair, checkRepairMigration }
