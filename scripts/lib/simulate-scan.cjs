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
const { RESULTS } = require('./scan-fixture.cjs')

const SCANNED_AT = '2026-08-02T05:00:00.000Z'

const INSERT = `INSERT INTO findings (id, project_id, severity, title, file, line, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)`

function simulateScan() {
  const db = new Database(join(app.getPath('userData'), 'fortress.db'))

  try {
    const projects = db.prepare('SELECT id FROM projects ORDER BY created_at ASC').all()
    const updateScan = db.prepare(
      'UPDATE projects SET fortress_score = ?, last_scan = ? WHERE id = ?'
    )
    const insert = db.prepare(INSERT)

    projects.forEach((row, index) => {
      const result = RESULTS[index % RESULTS.length]
      updateScan.run(result.score, SCANNED_AT, row.id)

      result.findings.forEach(([severity, title, file, line], n) =>
        insert.run(`${row.id}-${n}`, row.id, severity, title, file, line, SCANNED_AT)
      )
    })

    return projects.length
  } finally {
    db.close()
  }
}

module.exports = { simulateScan }
