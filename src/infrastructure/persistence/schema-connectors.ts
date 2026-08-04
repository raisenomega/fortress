/**
 * Tabla de conectores MCP. Aditiva y aparte del esquema base, en el estilo de
 * schema-telemetry.ts: se aplica en cada arranque, es idempotente y no toca
 * ninguna tabla existente, asi que una base ya creada sigue abriendose igual.
 *
 * No cuelga de projects: un conector es del operador, no de un proyecto, y
 * borrar un proyecto no debe apagarle Figma.
 */
export const CONNECTOR_SCHEMA = `
CREATE TABLE IF NOT EXISTS connectors (
  id          TEXT PRIMARY KEY,
  name        TEXT    NOT NULL,
  url         TEXT    NOT NULL DEFAULT '',
  description TEXT    NOT NULL DEFAULT '',
  category    TEXT    NOT NULL,
  enabled     INTEGER NOT NULL DEFAULT 0,
  builtin     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_connectors_enabled ON connectors (enabled);
`
