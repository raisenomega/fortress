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
const { INSERT, INSERT_ACTIVITY, INSERT_RUN } = require('./simulate-sql.cjs')

const SCANNED_AT = '2026-08-02T05:00:00.000Z'

function simulateScan() {
  const db = new Database(join(app.getPath('userData'), 'fortress.db'))

  try {
    const projects = db.prepare('SELECT id FROM projects ORDER BY created_at ASC').all()
    const updateScan = db.prepare(
      'UPDATE projects SET fortress_score = ?, last_scan = ? WHERE id = ?'
    )
    const insert = db.prepare(INSERT)
    const insertRun = db.prepare(INSERT_RUN)
    const insertActivity = db.prepare(INSERT_ACTIVITY)

    projects.forEach((row, index) => {
      const result = RESULTS[index % RESULTS.length]
      updateScan.run(result.score, SCANNED_AT, row.id)

      result.findings.forEach(([severity, title, file, line], n) =>
        insert.run(`${row.id}-${n}`, row.id, severity, title, file, line, SCANNED_AT)
      )
      // Con la hora actual a proposito: el indicador de la barra cuenta solo
      // lo consumido en la sesion en curso, y SCANNED_AT es de una anterior.
      insertRun.run(`run-${row.id}`, row.id, 0.0664025, new Date().toISOString())

      insertActivity.run(
        `act-${row.id}`,
        row.id,
        'scan',
        `Escaneo de seguridad: ${result.findings.length} hallazgos`,
        null,
        '',
        null,
        SCANNED_AT
      )
      result.findings.forEach(([severity, title, file, line], n) =>
        insertActivity.run(
          `act-${row.id}-${n}`,
          row.id,
          'finding',
          title,
          severity,
          file,
          line,
          SCANNED_AT
        )
      )
    })

    return projects.length
  } finally {
    db.close()
  }
}

module.exports = { simulateScan }
