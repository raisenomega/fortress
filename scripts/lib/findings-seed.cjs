/**
 * Escribe hallazgos directamente en la base temporal. Es la unica forma de
 * probar el bloqueo de push sin esperar un escaneo real de varios minutos;
 * lo que se ejercita despues si es el camino de verdad: canal IPC, caso de
 * uso y consulta SQL.
 */
const { app } = require('electron')
const { join } = require('path')
const Database = require('better-sqlite3')

function withDb(work) {
  const db = new Database(join(app.getPath('userData'), 'fortress.db'))
  try {
    return work(db)
  } finally {
    db.close()
  }
}

let sequence = 0

function insertFinding(projectId, severity, title) {
  sequence += 1
  return withDb((db) =>
    db
      .prepare(
        `INSERT INTO findings (id, project_id, severity, title, file, line, created_at)
         VALUES (?, ?, ?, ?, 'src/app.js', 1, ?)`
      )
      .run(`seed-${sequence}`, projectId, severity, title, new Date().toISOString())
  )
}

/** Simula el efecto de un escaneo sobre la fila del proyecto. */
function markScanned(projectId, score) {
  return withDb((db) =>
    db
      .prepare('UPDATE projects SET fortress_score = ?, last_scan = ? WHERE id = ?')
      .run(score, new Date().toISOString(), projectId)
  )
}

module.exports = { withDb, insertFinding, markScanned }
