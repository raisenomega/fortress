/**
 * La base TAL COMO la dejo B0 (PASO 104) antes de 'cto': el CHECK de CINCO
 * modos y, a proposito, SIN carpeta_id — la copia POR NOMBRE debe tragarsela
 * igual (la leccion de usage_known). `TOCADA` es la misma tabla pero sin CHECK
 * y con un modo que el CHECK nuevo rechaza: el recambio debe revertir ENTERO.
 */
export const VIEJO = `
CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE carpetas (id TEXT PRIMARY KEY, nombre TEXT NOT NULL,
  instrucciones TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  modo TEXT NOT NULL CHECK (modo IN ('terminal','libre','plan','investigacion','ejecutor')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_chats_project ON chats (project_id, updated_at);
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL
);
INSERT INTO projects VALUES ('p1','Uno');
INSERT INTO chats VALUES
  ('c1','p1','El Terminal','terminal','2026-10-01','2026-10-01'),
  ('c2',NULL,'Charla libre','libre','2026-10-02','2026-10-06'),
  ('c3',NULL,'Un plan','plan','2026-10-03','2026-10-03'),
  ('c4',NULL,'Una pesquisa','investigacion','2026-10-04','2026-10-04'),
  ('c5',NULL,'Una obra','ejecutor','2026-10-05','2026-10-05');
INSERT INTO chat_messages VALUES
  ('m1',NULL,'user','legado del Terminal','2026-09-01'),
  ('m2','c2','user','hola {"apiKey":"***"}','2026-10-02');`

export const TOCADA = `
CREATE TABLE chats (
  id TEXT PRIMARY KEY, project_id TEXT, titulo TEXT NOT NULL, modo TEXT NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
INSERT INTO chats VALUES
  ('c1',NULL,'sana','libre','2026-10-01','2026-10-01'),
  ('cx',NULL,'rota a mano','xxx','2026-10-02','2026-10-02');`
