/** Expediente del motor de reparacion disciplinado (propuestas C1->C2->C3). */
export const REPAIR_SCHEMA = `
CREATE TABLE IF NOT EXISTS repair_proposals (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  finding_id TEXT NOT NULL,
  base_sha TEXT NOT NULL,
  state TEXT NOT NULL,
  analysis_verdict TEXT,
  analysis_reason TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_repair_proposals_unica
  ON repair_proposals(project_id, finding_id, created_at);
CREATE INDEX IF NOT EXISTS idx_repair_proposals_estado
  ON repair_proposals(project_id, state);
`
