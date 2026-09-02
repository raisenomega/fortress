/**
 * W2 — repair:withdraw por el stack real. Es la unica salida de una propuesta
 * viva, asi que lo que se comprueba no es solo que responda: que la fila quede
 * CADUCADO, que el libro conserve la historia y gane un eslabon, y que la nota
 * del operador llegue al Libro de la Vida con su motivo.
 */
const { withDb } = require('../lib/findings-seed.cjs')
const { addProject, createRecorder } = require('../lib/renderer-checks.cjs')

const MOTIVO = 'el veredicto persistido rebota la firma'

function seed(projectId) {
  withDb((db) => {
    db.prepare(
      `INSERT INTO findings (id, project_id, severity, title, file, line, created_at)
       VALUES ('find-w9', ?, 'LOW', 'hallazgo con propuesta atascada', 'src/w.js', 1, ?)`
    ).run(projectId, new Date().toISOString())
    const propuesta = db.prepare(
      `INSERT INTO repair_proposals (id, project_id, finding_id, base_sha, state,
        analysis_verdict, analysis_reason, created_at, updated_at)
       VALUES (@id, @projectId, @findingId, 'sha', @state, 'REAL', 'razon original', @at, @at)`
    )
    propuesta.run({ id: 'w9-atascada', projectId, findingId: 'find-w9', state: 'OMEGA', at: 100 })
    propuesta.run({ id: 'w9-muerta', projectId, findingId: 'find-w9', state: 'MERGEADO', at: 110 })
    // Su hallazgo NO existe: retirar no lo resuelve, y no debe pedirlo. El
    // proyecto si es real — desde que `repair_proposals` cuelga de `projects`
    // con ON DELETE CASCADE, una propuesta sin proyecto ya no puede existir.
    propuesta.run({ id: 'w9-sin-hallazgo', projectId, findingId: 'find-nope', state: 'ANALIZADO', at: 120 }) // prettier-ignore
    db.prepare(
      `INSERT INTO proposal_events (id, proposal_id, seq, phase, event_type, to_state, actor, ts)
       VALUES ('ev-w9', 'w9-atascada', 1, 'SELECT', 'TRANSITION', 'ELEGIDO', 'motor', 100)`
    ).run()
  })
}

const notas = () =>
  withDb((db) =>
    db.prepare(`SELECT summary, evidence FROM omega_log WHERE summary LIKE 'Propuesta w9%'`).all()
  )

module.exports = async function repairWithdrawChecks(window) {
  const { results, check, run } = createRecorder(window)

  const added = await run(addProject('Withdraw W2', '/tmp/fortress-withdraw-w2', null))
  seed(added.value.id)

  const fantasma = await run(`window.api.repair.withdraw('nope')`)
  check('propuesta desconocida: error, no excepcion', fantasma.ok === false, JSON.stringify(fantasma)) // prettier-ignore

  const muerta = await run(`window.api.repair.withdraw('w9-muerta')`)
  check('una ya terminal no se retira', muerta.ok === false, JSON.stringify(muerta))

  const viva = await run(`window.api.repair.withdraw('w9-atascada', '${MOTIVO}')`)
  check('una viva en OMEGA se retira', viva.ok === true, JSON.stringify(viva))

  const caducada = await run(`window.api.repair.get('w9-atascada')`)
  check('queda CADUCADO con la razon del operador', caducada.state === 'CADUCADO' && caducada.analysisReason.includes('retirada por el operador'), JSON.stringify(caducada)) // prettier-ignore

  const libro = await run(`window.api.repair.events('w9-atascada')`)
  check('el libro CONSERVA lo viejo y gana el cierre', libro.length === 2 && libro[0].toState === 'ELEGIDO' && libro[1].toState === 'CADUCADO', JSON.stringify(libro.map((e) => e.toState))) // prettier-ignore

  const asientos = notas()
  check('el Libro de la Vida recibe la nota CON el motivo', asientos.length === 1 && asientos[0].evidence === MOTIVO, JSON.stringify(asientos)) // prettier-ignore

  const sinHallazgo = await run(`window.api.repair.withdraw('w9-sin-hallazgo')`)
  check('sin hallazgo vivo se retira igual', sinHallazgo.ok === true, JSON.stringify(sinHallazgo)) // prettier-ignore

  const sinMotivo = await run(`window.api.repair.get('w9-sin-hallazgo')`)
  check('sin motivo lo dice, no lo inventa', sinMotivo.analysisReason.includes('sin motivo escrito'), sinMotivo.analysisReason) // prettier-ignore

  return results
}
