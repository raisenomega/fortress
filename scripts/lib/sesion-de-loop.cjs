/**
 * La fila de `loop_sessions`, leida del disco.
 *
 * Se lee por SQL y no por un canal: ADR-107 retiro el loop y su canal IPC con
 * el, pero la TABLA se conserva a proposito —es historia medida— y que una
 * migracion no la destruya sigue siendo una garantia que hay que probar. Esta es
 * la unica lectura que le queda, y vive en la prueba, no en el producto.
 */
const { app } = require('electron')
const { join } = require('path')
const Database = require('better-sqlite3')

function sesionDeLoop(projectId) {
  const db = new Database(join(app.getPath('userData'), 'fortress.db'), { readonly: true })
  try {
    return db.prepare('SELECT * FROM loop_sessions WHERE project_id = ?').get(projectId) ?? null
  } finally {
    db.close()
  }
}

module.exports = { sesionDeLoop }
