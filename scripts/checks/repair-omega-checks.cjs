/**
 * I4 — repair:run-omega por el stack real SIN spawnear el agente (minutos y
 * tokens): caminos que rechazan antes del spawn. El juicio completo vive en
 * los unit tests con fakes; el estreno real sera sobre 675723 tras el rebuild.
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
      VALUES ('omega-sin-wt', ?, 'find-o', 'sha', 'GATE', 'REAL', 100, 100)`
    ).run(projectId)
    db.prepare(
      `INSERT INTO proposal_events (id, proposal_id, seq, phase, event_type, to_state, actor, evidence_json, ts)
      VALUES ('ev-o1', 'omega-sin-wt', 1, 'ANALYZE', 'TRANSITION', 'ANALIZADO', 'motor', ?, 1)`
    ).run(
      JSON.stringify({
        target: { id: 'find-o', severity: 'LOW', title: 't', file: 'src/a/b.ts', line: 1 },
        status: 'REAL',
        whatToChange: 'w',
        where: 'src/a/b.ts',
        patternToCopy: 'p',
        doNotTouch: 'n',
        risk: 'r',
        tokensUsed: 1
      })
    )
  } finally {
    db.close()
  }
}

module.exports = async function repairOmegaChecks(window) {
  const { results, check, run } = createRecorder(window)

  const added = await run(addProject('Omega I4', '/tmp/fortress-omega-i4', null))
  seed(added.value.id)

  const sinWt = await run(`window.api.repair.runOmega('omega-sin-wt')`)
  check('GATE sin worktree: RECHAZADO worktree_missing', sinWt.ok === false && sinWt.reason === 'worktree_missing', JSON.stringify(sinWt)) // prettier-ignore
  const fila = await run(`window.api.repair.get('omega-sin-wt')`)
  check('quedo RECHAZADO en el expediente', fila.state === 'RECHAZADO')
  const libro = await run(`window.api.repair.events('omega-sin-wt')`)
  check('el cierre quedo en fase OMEGA con fromState GATE', libro.some((e) => e.phase === 'OMEGA' && e.toState === 'RECHAZADO' && e.fromState === 'GATE')) // prettier-ignore

  const repetido = await run(`window.api.repair.runOmega('omega-sin-wt')`)
  check('re-correr sobre RECHAZADO: invalid_state', repetido.ok === false && repetido.reason === 'invalid_state') // prettier-ignore

  const fantasma = await run(`window.api.repair.runOmega('nope')`)
  check('propuesta desconocida: invalid_state', fantasma.ok === false && fantasma.reason === 'invalid_state') // prettier-ignore

  return results
}
