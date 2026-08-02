/**
 * Escribe scores y fecha de escaneo directamente en la base temporal del
 * preview. Simula el estado posterior a un scan FORTRESS para poder ver como
 * se pintan los gauges; el scanner real todavia no existe.
 *
 * Solo para los scripts de verificacion: la app nunca hace esto.
 */
const { app } = require('electron')
const { join } = require('path')
const Database = require('better-sqlite3')

const SCORES = [92, 78, 58]
const SCANNED_AT = '2026-08-01T05:00:00.000Z'

function simulateScan() {
  const db = new Database(join(app.getPath('userData'), 'fortress.db'))
  try {
    const ids = db.prepare('SELECT id FROM projects ORDER BY created_at ASC').all()
    const update = db.prepare('UPDATE projects SET fortress_score = ?, last_scan = ? WHERE id = ?')
    ids.forEach((row, index) => update.run(SCORES[index % SCORES.length], SCANNED_AT, row.id))
    return ids.length
  } finally {
    db.close()
  }
}

module.exports = { simulateScan }
