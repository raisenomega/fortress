/** Lectura de COGNITION-LOG.md a traves del canal IPC real. */
const { writeCognitionLog, removeCognitionLog } = require('../lib/cognition-fixture.cjs')
const { addProject, createRecorder } = require('../lib/renderer-checks.cjs')

const CON_LOG = '/tmp/fortress-cognition-con'
const SIN_LOG = '/tmp/fortress-cognition-sin'

module.exports = async function cognitionChecks(window) {
  const { results, check, run } = createRecorder(window)
  writeCognitionLog(CON_LOG)

  try {
    const conLog = await run(addProject('ConCerebro', CON_LOG, null))
    const snapshot = await run(`window.api.cognition.read('${conLog.value.id}')`)

    check('encuentra el log del proyecto', snapshot.present, JSON.stringify(snapshot).slice(0, 120))
    check('lee la generacion', snapshot.generation === 2)
    check('lee los tres patrones', snapshot.patterns.length === 3)
    check(
      'lee estados distintos',
      snapshot.patterns.map((p) => p.status).join(',') === 'EXTINTO,ACTIVE,MITIGATED',
      JSON.stringify(snapshot.patterns.map((p) => p.status))
    )
    check('lee el mapa de atencion', snapshot.attention.length === 3)
    check(
      'NO cuela la zona del bloque EJEMPLO',
      !snapshot.attention.some((zone) => zone.zone.includes('inventado')),
      JSON.stringify(snapshot.attention.map((z) => z.zone))
    )
    check('lee la reflexion de sesion', snapshot.reflections[0]?.session === '2026-08-01')

    const sinLog = await run(addProject('SinCerebro', SIN_LOG, null))
    const vacio = await run(`window.api.cognition.read('${sinLog.value.id}')`)
    check('un proyecto sin log no es un error', vacio.present === false, JSON.stringify(vacio))
  } finally {
    removeCognitionLog(CON_LOG)
  }

  return results
}
