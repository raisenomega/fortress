/** Historico de auditorias de calidad (6 dimensiones) para graficar la tendencia. */
export const QUALITY_SCHEMA = `
CREATE TABLE IF NOT EXISTS quality_scans (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  global INTEGER NOT NULL,
  partial INTEGER NOT NULL,
  dim_seguridad INTEGER,
  dim_correctitud INTEGER,
  dim_tests INTEGER,
  dim_mantenibilidad INTEGER,
  dim_dependencias INTEGER,
  dim_operacion INTEGER,
  at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_quality_scans_project ON quality_scans(project_id, at);
`
