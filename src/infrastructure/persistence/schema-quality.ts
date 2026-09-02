/** Historico de auditorias de calidad (6 dimensiones) para graficar la tendencia. */

/**
 * Columnas aparte por lo mismo que en `schema-repair`: la migracion de la clave
 * foranea recrea la tabla desde ESTA definicion, y el `INSERT ... SELECT *` del
 * recambio exige el mismo orden.
 *
 * `project_id` cascadea: una auditoria mide ESE repositorio y no dice nada de
 * nadie sin el. Mismo trato que la telemetria, que ya colgaba entera.
 */
export const QUALITY_SCANS_COLUMNS = `
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  global INTEGER NOT NULL,
  partial INTEGER NOT NULL,
  dim_seguridad INTEGER,
  dim_correctitud INTEGER,
  dim_tests INTEGER,
  dim_mantenibilidad INTEGER,
  dim_dependencias INTEGER,
  dim_operacion INTEGER,
  at TEXT NOT NULL
`

export const QUALITY_SCANS_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_quality_scans_project ON quality_scans(project_id, at);
`

export const QUALITY_SCHEMA = `
CREATE TABLE IF NOT EXISTS quality_scans (${QUALITY_SCANS_COLUMNS});
${QUALITY_SCANS_INDEXES}
`
