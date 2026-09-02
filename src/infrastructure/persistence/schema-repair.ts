/** Expediente del motor de reparacion disciplinado (propuestas C1->C2->C3). */

/**
 * Las columnas, aparte para que la migracion de la clave foranea recree la tabla
 * desde ESTA definicion. Dos copias del mismo esquema acabarian divergiendo, y
 * el `INSERT ... SELECT *` del recambio exige el MISMO orden de columnas.
 *
 * `project_id` cascadea: una propuesta es el expediente de reparar ESE
 * repositorio y no puede sobrevivirlo. Sin proyecto no hay arbol que tocar, ni
 * hallazgo del que nacio, ni vista que la muestre — solo una fila viva que
 * congela su hallazgo y no aparece en ninguna pantalla. La FK faltaba por
 * omision, no por decision: `proposal_events` ya colgaba de aqui igual.
 */
export const REPAIR_PROPOSALS_COLUMNS = `
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  finding_id TEXT NOT NULL,
  base_sha TEXT NOT NULL,
  state TEXT NOT NULL,
  analysis_verdict TEXT,
  analysis_reason TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
`

export const REPAIR_PROPOSALS_INDEXES = `
CREATE UNIQUE INDEX IF NOT EXISTS idx_repair_proposals_unica
  ON repair_proposals(project_id, finding_id, created_at);
CREATE INDEX IF NOT EXISTS idx_repair_proposals_estado
  ON repair_proposals(project_id, state);
`

export const REPAIR_SCHEMA = `
CREATE TABLE IF NOT EXISTS repair_proposals (${REPAIR_PROPOSALS_COLUMNS});
${REPAIR_PROPOSALS_INDEXES}
`
