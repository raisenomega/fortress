/**
 * I4.2 — repair:retry por el stack real SIN spawnear C2 (tokens y minutos):
 * los 4 caminos que rechazan ANTES del spawn. El camino feliz (C2 fresco,
 * REAL/OBSOLETO) vive en los unit tests con analista fake.
 */
const { withDb } = require('../lib/findings-seed.cjs')
const { addProject, createRecorder } = require('../lib/renderer-checks.cjs')

const VETO = 'omega_vetado: veto de prueba'

function seed(projectId) {
  withDb((db) => {
    db.prepare(
      `INSERT INTO findings (id, project_id, severity, title, file, line, created_at)
       VALUES ('find-r42', ?, 'LOW', 'hallazgo vivo para retry', 'src/r.js', 1, ?)`
    ).run(projectId, new Date().toISOString())
    const propuesta = db.prepare(
      `INSERT INTO repair_proposals (id, project_id, finding_id, base_sha, state,
        analysis_verdict, analysis_reason, created_at, updated_at)
       VALUES (@id, @projectId, @findingId, 'sha', @state, 'REAL', @reason, @at, @at)`
    )
    propuesta.run({ id: 'r42-tecnico', projectId, findingId: 'find-r42', state: 'RECHAZADO', reason: 'budget_exceeded', at: 100 }) // prettier-ignore
    propuesta.run({ id: 'r42-extinto', projectId, findingId: 'find-nope', state: 'RECHAZADO', reason: VETO, at: 100 }) // prettier-ignore
    propuesta.run({ id: 'r42-pisada', projectId, findingId: 'find-r42', state: 'RECHAZADO', reason: VETO, at: 110 }) // prettier-ignore
    propuesta.run({ id: 'r42-posterior', projectId, findingId: 'find-r42', state: 'ELEGIDO', reason: null, at: 200 }) // prettier-ignore
  })
}

module.exports = async function repairRetryChecks(window) {
  const { results, check, run } = createRecorder(window)

  const added = await run(addProject('Retry I4.2', '/tmp/fortress-retry-i42', null))
  seed(added.value.id)

  const fantasma = await run(`window.api.repair.retry('nope')`)
  check('propuesta desconocida: unknown_proposal', fantasma.ok === false && fantasma.reason === 'unknown_proposal', JSON.stringify(fantasma)) // prettier-ignore

  const tecnico = await run(`window.api.repair.retry('r42-tecnico')`)
  check('rechazo TECNICO (budget_exceeded) invisible: not_retryable', tecnico.ok === false && tecnico.reason === 'not_retryable', JSON.stringify(tecnico)) // prettier-ignore

  const extinto = await run(`window.api.repair.retry('r42-extinto')`)
  check('hallazgo ya no vivo: finding_extinct', extinto.ok === false && extinto.reason === 'finding_extinct', JSON.stringify(extinto)) // prettier-ignore

  const pisada = await run(`window.api.repair.retry('r42-pisada')`)
  check('con propuesta posterior: already_superseded_by', pisada.ok === false && pisada.reason === 'already_superseded_by=r42-post', JSON.stringify(pisada)) // prettier-ignore

  const vieja = await run(`window.api.repair.get('r42-pisada')`)
  check('la vieja queda INTACTA (RECHAZADO, razon original)', vieja.state === 'RECHAZADO' && vieja.analysisReason === VETO) // prettier-ignore

  const expediente = await run(`window.api.repair.list('${added.value.id}')`)
  check('ningun camino fallido inserto propuesta nueva', expediente.length === 4)

  return results
}
