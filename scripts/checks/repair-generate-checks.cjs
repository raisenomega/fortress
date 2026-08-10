/**
 * I2 — repair:generate por el stack real, SIN spawnear el generador: se
 * ejercitan los caminos que rechazan ANTES del spawn (supersede R1, presupuesto
 * R2, estado invalido). El camino feliz con agente vive en los unit tests con
 * fakes; la evidencia end-to-end llega con el rebuild y el boton.
 */
const { app } = require('electron')
const { join } = require('path')
const Database = require('better-sqlite3')
const { addProject, createRecorder } = require('../lib/renderer-checks.cjs')

function seed(projectId) {
  const db = new Database(join(app.getPath('userData'), 'fortress.db'))
  try {
    const insert = db.prepare(`INSERT INTO repair_proposals
      (id, project_id, finding_id, base_sha, state, analysis_verdict, created_at, updated_at)
      VALUES (?, ?, ?, 'sha', 'ANALIZADO', 'REAL', ?, ?)`)
    insert.run('gen-vieja', projectId, 'find-x', 100, 100)
    insert.run('gen-nueva', projectId, 'find-x', 200, 200)
    insert.run('gen-cara', projectId, 'find-y', 300, 300)
    db.prepare(
      `INSERT INTO proposal_events (id, proposal_id, seq, phase, event_type, actor, cost_tokens, ts)
      VALUES ('ev-caro', 'gen-cara', 1, 'ANALYZE', 'AGENT_RUN', 'claude-analyst', 1900000, 1)`
    ).run()
  } finally {
    db.close()
  }
}

module.exports = async function repairGenerateChecks(window) {
  const { results, check, run } = createRecorder(window)

  const added = await run(addProject('Motor I2', '/tmp/fortress-repair-i2', null))
  seed(added.value.id)

  const vieja = await run(`window.api.repair.generate('gen-vieja')`)
  check('R1: la vieja CADUCA superseded sin spawnear', vieja.ok === false && vieja.reason === 'superseded', JSON.stringify(vieja)) // prettier-ignore
  const caducada = await run(`window.api.repair.get('gen-vieja')`)
  check('la vieja quedo CADUCADO con superseded_by en la razon',
    caducada.state === 'CADUCADO' && /superseded_by=gen-nuev/.test(caducada.analysisReason)) // prettier-ignore
  const libro = await run(`window.api.repair.events('gen-vieja')`)
  check(
    'el libro asento el EXPIRE del supersede',
    libro.some((e) => e.phase === 'EXPIRE')
  )

  const cara = await run(`window.api.repair.generate('gen-cara')`)
  check('R2: sin margen de presupuesto RECHAZA sin spawnear', cara.ok === false && cara.reason === 'budget_exceeded', JSON.stringify(cara)) // prettier-ignore
  const rechazada = await run(`window.api.repair.get('gen-cara')`)
  check('quedo RECHAZADO budget_exceeded', rechazada.state === 'RECHAZADO' && rechazada.analysisReason === 'budget_exceeded') // prettier-ignore

  const fantasma = await run(`window.api.repair.generate('no-existe')`)
  check('propuesta desconocida: invalid_state sin mutar nada', fantasma.ok === false && fantasma.reason === 'invalid_state') // prettier-ignore

  return results
}
