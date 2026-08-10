/**
 * I3 — repair:run-gate por el stack real SIN correr npm ci (minutos): se
 * ejercitan los caminos que rechazan antes del runner. El gate completo con
 * comandos reales vive en gate-runner.test (binarios fake) y su estreno en
 * vivo sera sobre c2bef98 tras el rebuild.
 */
const { app } = require('electron')
const { join } = require('path')
const Database = require('better-sqlite3')
const { addProject, createRecorder } = require('../lib/renderer-checks.cjs')

function seed(projectId) {
  const db = new Database(join(app.getPath('userData'), 'fortress.db'))
  try {
    db.prepare(
      `INSERT INTO repair_proposals
      (id, project_id, finding_id, base_sha, state, analysis_verdict, created_at, updated_at)
      VALUES ('gate-sin-wt', ?, 'find-g', 'sha', 'GENERADO', 'REAL', 100, 100)`
    ).run(projectId)
  } finally {
    db.close()
  }
}

module.exports = async function repairGateChecks(window) {
  const { results, check, run } = createRecorder(window)

  const added = await run(addProject('Gate I3', '/tmp/fortress-gate-i3', null))
  seed(added.value.id)

  const sinWt = await run(`window.api.repair.runGate('gate-sin-wt')`)
  check('GENERADO sin worktree: RECHAZADO worktree_missing', sinWt.ok === false && sinWt.reason === 'worktree_missing', JSON.stringify(sinWt)) // prettier-ignore
  const fila = await run(`window.api.repair.get('gate-sin-wt')`)
  check('quedo RECHAZADO con la razon en el expediente', fila.state === 'RECHAZADO' && fila.analysisReason === 'worktree_missing') // prettier-ignore
  const libro = await run(`window.api.repair.events('gate-sin-wt')`)
  check('el libro asento el cierre en fase GATE', libro.some((e) => e.phase === 'GATE' && e.toState === 'RECHAZADO')) // prettier-ignore

  const repetido = await run(`window.api.repair.runGate('gate-sin-wt')`)
  check('re-correr sobre RECHAZADO: invalid_state sin mutar', repetido.ok === false && repetido.reason === 'invalid_state') // prettier-ignore

  const fantasma = await run(`window.api.repair.runGate('nope')`)
  check('propuesta desconocida: invalid_state', fantasma.ok === false && fantasma.reason === 'invalid_state') // prettier-ignore

  return results
}
