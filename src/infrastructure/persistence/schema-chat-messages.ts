/**
 * La forma NUEVA de chat_messages (PASO 104, B0) y la tabla de HILOS. Un chat
 * es un hilo con titulo y modo; `project_id` es NULLABLE a proposito —el chat
 * LIBRE no tiene proyecto— y `chat_id` NULL marca el hilo LEGADO: las filas
 * anteriores al multi-chat, agrupadas por proyecto EN LECTURA, sin backfill.
 * Las constantes viven aqui para que el esquema base y el RECAMBIO de la
 * migracion construyan EXACTAMENTE la misma tabla (molde agent_runs).
 */
export const CHATS_SCHEMA = `
CREATE TABLE IF NOT EXISTS chats (
  id         TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  titulo     TEXT NOT NULL,
  modo       TEXT NOT NULL CHECK (modo IN ('terminal','libre','plan','investigacion','ejecutor')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chats_project ON chats (project_id, updated_at);
`

export const CHAT_MESSAGES_COLUMNS = `
  id         TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  chat_id    TEXT REFERENCES chats(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,
  content    TEXT NOT NULL,
  agent_id   TEXT,
  mode       TEXT NOT NULL,
  engine     TEXT NOT NULL DEFAULT 'api',
  created_at TEXT NOT NULL`

/** OJO (lo cazo la suite de migracion): estos indices NO van en el esquema
 *  base — sobre una tabla VIEJA sin chat_id, el CREATE INDEX explota en el
 *  arranque ANTES de migrar (IF NOT EXISTS salva la tabla, no el indice).
 *  Se aplican idempotentes DESPUES del recambio, cuando toda base ya tiene la
 *  columna; el esquema base solo lleva idx_chat_project, que existe en ambas. */
export const CHAT_MESSAGES_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_chat_project ON chat_messages (project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_hilo ON chat_messages (chat_id, created_at);
`
