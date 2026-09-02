/**
 * La base TAL COMO la tiene el operador: `repair_proposals` y `quality_scans`
 * con un `project_id` suelto, sin clave foranea. Dos proyectos vivos, uno ya
 * borrado (`muerto`) que dejo atras una propuesta con sus dos eventos, una
 * auditoria y un asiento en el Libro.
 */
export const SIN_FK = `
CREATE TABLE projects (id TEXT PRIMARY KEY);
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

INSERT INTO projects VALUES ('vivo'), ('otro');
INSERT INTO repair_proposals (id, project_id, finding_id, base_sha, state, created_at, updated_at)
  VALUES ('p-viva', 'vivo', 'h1', 'sha1', 'ANALIZADO', 1, 1),
         ('p-otro', 'otro', 'h2', 'sha2', 'MERGEADO', 2, 2),
         ('p-huerfana', 'muerto', 'h3', 'sha3', 'CADUCADO', 3, 3);
INSERT INTO proposal_events (id, proposal_id, seq, phase, event_type, actor, ts)
  VALUES ('e1', 'p-viva', 1, 'SELECT', 'TRANSITION', 'motor', 1),
         ('e2', 'p-otro', 1, 'SELECT', 'TRANSITION', 'motor', 2),
         ('e3', 'p-huerfana', 1, 'SELECT', 'TRANSITION', 'motor', 3),
         ('e4', 'p-huerfana', 2, 'EXPIRE', 'TRANSITION', 'motor', 4);
INSERT INTO quality_scans (id, project_id, global, partial, at)
  VALUES ('q-vivo', 'vivo', 90, 0, '2026-08-01'),
         ('q-huerfano', 'muerto', 84, 0, '2026-08-02');
INSERT INTO omega_log (id, at, project_id, kind, verdict, summary)
  VALUES ('o1', '2026-08-02', 'muerto', 'nota', 'info', 'el Libro sobrevive');
`
