/**
 * El Libro de la Vida de OMEGA. SIN clave foranea a projects a proposito: el
 * asiento forense SOBREVIVE al proyecto (la ley del registro eterno). Quitar un
 * proyecto se lleva su chat/hallazgos por cascada, pero nunca su historia aqui.
 * Idempotente: se aplica en cada arranque.
 */
export const OMEGA_SCHEMA = `
CREATE TABLE IF NOT EXISTS omega_log (
  id         TEXT PRIMARY KEY,
  at         TEXT NOT NULL,
  project_id TEXT,
  agent_id   TEXT,
  kind       TEXT NOT NULL,
  verdict    TEXT NOT NULL,
  summary    TEXT NOT NULL,
  evidence   TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_omega_project ON omega_log (project_id, at);
`
