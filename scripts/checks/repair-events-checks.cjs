/**
 * I1.5-b — repair:events por el stack real. La cadena se SIEMBRA en la base
 * (emitirla de verdad exigiria spawnear el analista, vetado en integracion; la
 * emision se prueba unitaria con analista fake) y aqui se verifica que el
 * canal devuelve el libro completo, en orden, con los campos que viajaron.
 */
const { app } = require('electron')
const { join } = require('path')
const Database = require('better-sqlite3')
const { addProject, createRecorder } = require('../lib/renderer-checks.cjs')

function seedChain(projectId) {
  const db = new Database(join(app.getPath('userData'), 'fortress.db'))
  try {
    db.prepare(
      `INSERT INTO repair_proposals (id, project_id, finding_id, base_sha, state, analysis_verdict, created_at, updated_at)
       VALUES ('pe-1', ?, 'f-1', 'sha', 'ANALIZADO', 'REAL', 100, 300)`
    ).run(projectId)
    const insert = db.prepare(
      `INSERT INTO proposal_events (id, proposal_id, seq, phase, event_type, to_state, actor, cost_tokens, duration_ms, ts)
       VALUES (?, 'pe-1', ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    insert.run('e1', 1, 'SELECT', 'TRANSITION', 'ELEGIDO', 'motor', null, null, 100)
    insert.run('e2', 2, 'ANALYZE', 'AGENT_RUN', null, 'claude-analyst', 4321, 105000, 200)
    insert.run('e3', 3, 'ANALYZE', 'TRANSITION', 'ANALIZADO', 'motor', null, null, 300)
  } finally {
    db.close()
  }
}

module.exports = async function repairEventsChecks(window) {
  const { results, check, run } = createRecorder(window)

  const added = await run(addProject('Libro I1.5', '/tmp/fortress-libro-i15', null))
  seedChain(added.value.id)

  const libro = await run(`window.api.repair.events('pe-1')`)
  check('repair:events devuelve la cadena completa', libro.length === 3, JSON.stringify(libro))
  check('en orden de seq', libro.map((e) => e.seq).join(',') === '1,2,3')
  check(
    'el eslabon del analista viaja con coste y duracion',
    libro[1].actor === 'claude-analyst' && libro[1].costTokens === 4321 && libro[1].durationMs === 105000, // prettier-ignore
    JSON.stringify(libro[1])
  )
  check('los NULL llegan como undefined, no como null', !('costTokens' in libro[0]))

  const vacio = await run(`window.api.repair.events('no-existe')`)
  check('una propuesta desconocida devuelve libro vacio', Array.isArray(vacio) && vacio.length === 0) // prettier-ignore

  return results
}
