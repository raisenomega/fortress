/**
 * Arranca la app sobre una base con el esquema viejo y comprueba que las
 * migraciones anaden lo que falta sin perder nada. Va aparte del resto de la
 * integracion porque necesita escribir la base ANTES de que la app la abra.
 */
const { app } = require('electron')
const harness = require('./lib/app-harness.cjs')
const { writeLegacyDatabase } = require('./lib/legacy-db.cjs')
const { checkMigracionesPorSql } = require('./lib/legacy-por-sql.cjs')
const { checkProjectBackfills } = require('./lib/legacy-project-checks.cjs')
const { createRecorder } = require('./lib/renderer-checks.cjs')
const { report } = require('./lib/suite-runner.cjs')
const { sesionDeLoop } = require('./lib/sesion-de-loop.cjs')

harness.useTemporaryUserData()
writeLegacyDatabase()
harness.bootMainProcess()

async function verify(window) {
  const { results, check, run } = createRecorder(window)

  checkProjectBackfills(check, await run('window.api.projects.list()'))

  const historial = await run("window.api.chat.history('viejo')")
  check('conserva el historial de chat', historial.length === 1, JSON.stringify(historial))
  check('rellena el motor por defecto', historial[0]?.engine === 'api')

  // La sesion de loop es anterior al motivo: se conserva entera y sus campos
  // nuevos quedan ausentes, que es "no consta". Por SQL (ADR-107, ver el lib).
  const sesion = sesionDeLoop('viejo')
  check('conserva la sesion de loop', sesion?.cycles_done === 2, JSON.stringify(sesion))
  check('la sesion vieja no consta con motivo', sesion?.stopped_reason === null)

  const hallazgos = await run("window.api.scan.findings('viejo')")
  check(
    'conserva los hallazgos',
    hallazgos.some((h) => h.file === 'api.js'),
    JSON.stringify(hallazgos)
  )
  check(
    'el hallazgo viejo queda abierto',
    hallazgos.every((h) => h.status === 'open')
  )

  const conteos = await run('window.api.scan.counts()')
  check('sigue contando el CRITICAL', conteos.viejo?.CRITICAL === 1, JSON.stringify(conteos))

  const push = await run("window.api.push.run('viejo')")
  check('el CRITICAL heredado sigue bloqueando', !push.ok, JSON.stringify(push))

  const descarte = await run(`window.api.scan.dismiss('${hallazgos[0]?.id}')`)
  check('se puede descartar un hallazgo migrado', descarte.ok, JSON.stringify(descarte))

  // Lo que se afirma por SQL, porque lo que cambia es el esquema o las claves.
  checkMigracionesPorSql(check)

  return results
}

app.whenReady().then(async () => {
  const window = harness.createRendererWindow()
  let failed = 1

  try {
    await harness.loadRenderer(window)
    failed = report('Migracion desde el esquema viejo', await verify(window))
  } catch (error) {
    console.error(`\nMIGRATION FAIL: ${error.message}`)
  } finally {
    harness.cleanup()
  }

  console.log(failed === 0 ? '\nMIGRATION OK' : `\nMIGRATION FAIL: ${failed}`)
  app.exit(failed === 0 ? 0 : 1)
})
