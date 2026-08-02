/**
 * Siembra el resultado de un escaneo (score y hallazgos) en la base temporal
 * del preview. Un escaneo real tarda minutos y depende de la red; para mirar
 * como se pinta la UI eso no aporta nada. El escaner de verdad se verifica
 * aparte, con `npm run verify:scan`.
 *
 * Solo para los scripts de verificacion: la app nunca escribe asi.
 */
const { app } = require('electron')
const { join } = require('path')
const Database = require('better-sqlite3')
const { INSERT, INSERT_ACTIVITY, INSERT_RUN, INSERT_SCAN } = require('./simulate-sql.cjs')
const { seedProject } = require('./simulate-project.cjs')

function simulateScan() {
  const db = new Database(join(app.getPath('userData'), 'fortress.db'))

  try {
    const projects = db.prepare('SELECT id FROM projects ORDER BY created_at ASC').all()
    const statements = {
      updateScan: db.prepare('UPDATE projects SET fortress_score = ?, last_scan = ? WHERE id = ?'),
      insert: db.prepare(INSERT),
      insertRun: db.prepare(INSERT_RUN),
      insertActivity: db.prepare(INSERT_ACTIVITY),
      insertScan: db.prepare(INSERT_SCAN)
    }

    projects.forEach((row, index) => seedProject(statements, row.id, index))

    return projects.length
  } finally {
    db.close()
  }
}

module.exports = { simulateScan }
