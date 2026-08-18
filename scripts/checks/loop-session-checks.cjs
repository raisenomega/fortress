/**
 * La razon por la que el loop paro sobrevive al cierre de la ventana. Se
 * consulta por el canal real (renderer -> preload -> IPC -> SQLite): es
 * exactamente lo que hace el panel cuando el operador vuelve por la manana y
 * ya no queda estado en vivo que mirar.
 */
const { app } = require('electron')
const { join } = require('path')
const Database = require('better-sqlite3')
const { addProject, createRecorder } = require('../lib/renderer-checks.cjs')

const AT = '2026-08-17T04:00:00.000Z'

/** Una sesion que ya paro, escrita como la deja el motor al terminar. */
function seedStoppedSession(projectId) {
  const db = new Database(join(app.getPath('userData'), 'fortress.db'))
  try {
    db.prepare(
      `INSERT INTO loop_sessions (project_id, active, cycles_done, recent_scores,
         spent_baseline, updated_at, stopped_reason, stopped_reason_detail, stopped_at)
       VALUES (?, 0, 3, '[100]', 0.5, ?, 'tope-gasto', '$5.00 de $5.00', ?)`
    ).run(projectId, AT, AT)
  } finally {
    db.close()
  }
}

module.exports = async function loopSessionChecks(window) {
  const { results, check, run } = createRecorder(window)

  const alta = await run(addProject('Sesion de loop', '/tmp/fortress-loop-sesion', null))
  const id = alta.value.id

  const sinSesion = await run(`window.api.chat.lastLoopSession('${id}')`)
  check('sin sesion guardada responde null', sinSesion === null, JSON.stringify(sinSesion))

  seedStoppedSession(id)
  const sesion = await run(`window.api.chat.lastLoopSession('${id}')`)
  check('devuelve la razon persistida', sesion?.stoppedReason === 'tope-gasto', JSON.stringify(sesion)) // prettier-ignore
  check('devuelve la cifra que la acompana', sesion?.stoppedReasonDetail === '$5.00 de $5.00')
  check('devuelve el momento de la parada', sesion?.stoppedAt === AT)
  check('la sesion consta como parada', sesion?.active === false)

  return results
}
