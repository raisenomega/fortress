/**
 * El trozo de base legacy que le toca a los hilos del chat: `chats` TAL COMO
 * la dejo B0 (PASO 104) — el CHECK de CINCO modos, sin carpeta_id—. Sin esto
 * la suite NO ejercitaba el recambio de 'cto': el esquema base crea la tabla
 * ya con los seis modos y el guard corta antes de tocar nada (la misma
 * ceguera que documenta legacy-runs). Los dos hilos van SIN modo libre a
 * proposito: un libre suelto y vacio es comida del barrido-al-abrir (PASO
 * 120) y este trozo afirma el recambio, no la limpieza.
 */
const { withDb } = require('./findings-seed.cjs')

const LEGACY_CHATS = `
CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  modo TEXT NOT NULL CHECK (modo IN ('terminal','libre','plan','investigacion','ejecutor')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_chats_project ON chats (project_id, updated_at);

INSERT INTO chats VALUES
  ('hilo-terminal', 'viejo', 'El Terminal', 'terminal', '2026-10-01', '2026-10-01'),
  ('hilo-plan', 'viejo', 'Un plan', 'plan', '2026-10-02', '2026-10-02');
`

const writeLegacyChats = (db) => db.exec(LEGACY_CHATS)

/** Que el recambio de 'cto' corrio de verdad, y sin llevarse un hilo. */
function checkChatsMigration(check) {
  withDb((db) => {
    const ddl = db.prepare("SELECT sql FROM sqlite_master WHERE name = 'chats'").get().sql
    check('el CHECK de modos admite cto', ddl.includes("'cto'"), ddl)

    const hilos = db.prepare('SELECT id, modo, carpeta_id FROM chats ORDER BY id').all()
    check('el recambio conserva los dos hilos', hilos.length === 2, JSON.stringify(hilos))
    check('con su modo intacto', hilos[0]?.modo === 'plan' && hilos[1]?.modo === 'terminal')
    // Copiada por NOMBRE: la base del 104 no tenia carpeta_id y estrena NULL.
    check(
      'y carpeta_id estrenada en NULL',
      hilos.every((h) => h.carpeta_id === null)
    )

    const indices = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'chats'").all().map((i) => i.name) // prettier-ignore
    check('los indices renacen con la tabla', indices.includes('idx_chats_project') && indices.includes('idx_chats_carpeta'), JSON.stringify(indices)) // prettier-ignore

    const ok = db.prepare("INSERT INTO chats (id, project_id, titulo, modo, created_at, updated_at) VALUES ('hilo-cto', NULL, 'CTO', 'cto', '2026-10-08', '2026-10-08')") // prettier-ignore
    check('y ya acepta un hilo cto', ok.run().changes === 1)
  })
}

module.exports = { writeLegacyChats, checkChatsMigration }
