/**
 * SENTINEL OMEGA a traves del stack real (I): el Libro de la Vida append-only y
 * eterno, la verificacion contra el filesystem, y la evidencia leida del disco.
 * La puntuacion y el veto de push viven en omega-score-checks.cjs.
 */
const { createRecorder } = require('../lib/renderer-checks.cjs')
const { addExpr } = require('../lib/omega-seed.cjs')
const omegaFsChecks = require('../lib/omega-fs-checks.cjs')

module.exports = async function omegaChecks(window) {
  const { results, check, run } = createRecorder(window)

  // --- Parte A: registro eterno (proyecto sin hallazgos) ---
  const a = await run(addExpr('OmegaEterno', '/tmp/fortress-omega-eterno'))
  const idA = a.ok ? a.value.id : ''
  check('el libro arranca vacio', (await run(`window.api.omega.list('${idA}')`)).length === 0)
  await run(`window.api.omega.audit('${idA}')`)
  await run(`window.api.omega.audit('${idA}')`)
  check(
    'las auditorias se ACUMULAN (append-only)',
    (await run(`window.api.omega.list('${idA}')`)).length === 2
  )
  check(
    'el puente no expone borrar el libro',
    (await run('typeof window.api.omega.delete')) === 'undefined'
  )
  await run(`window.api.projects.remove('${idA}')`)
  check(
    'el Libro de la Vida SOBREVIVE al proyecto (eterno)',
    (await run(`window.api.omega.list('${idA}')`)).length === 2
  )

  // --- Partes B y E: filesystem y evidencia (en su propio modulo) ---
  await omegaFsChecks(run, check)

  return results
}
