/** Hallazgos: persistencia, conteos y limpieza al borrar el proyecto. */
const { insertFinding, markScanned, withDb } = require('../lib/findings-seed.cjs')
const { addProject, createRecorder } = require('../lib/renderer-checks.cjs')

const PATH = '/tmp/fortress-scan-fixture'

module.exports = async function scanChecks(window) {
  const { results, check, run } = createRecorder(window)

  const added = await run(addProject('Scan', PATH, 'git@example.com:acme/scan.git'))
  check('crea el proyecto de prueba', added.ok, JSON.stringify(added))
  const id = added.ok ? added.value.id : ''

  check(
    'un proyecto nuevo no tiene hallazgos',
    (await run(`window.api.scan.findings('${id}')`)).length === 0
  )

  const vacios = await run('window.api.scan.counts()')
  check('los conteos no inventan un proyecto sin escanear', vacios[id] === undefined)

  insertFinding(id, 'CRITICAL', 'API key hardcodeada')
  insertFinding(id, 'LOW', 'console.log olvidado')
  markScanned(id, 64)

  const findings = await run(`window.api.scan.findings('${id}')`)
  check(
    'devuelve los hallazgos con lo urgente primero',
    findings.length === 2 && findings[0].severity === 'CRITICAL',
    JSON.stringify(findings)
  )

  const counts = await run('window.api.scan.counts()')
  check(
    'cuenta por severidad',
    counts[id]?.CRITICAL === 1 && counts[id]?.LOW === 1,
    JSON.stringify(counts[id])
  )

  let rechazada = false
  try {
    insertFinding(id, 'URGENTE', 'severidad inventada')
  } catch {
    rechazada = true
  }
  check('la base rechaza una severidad fuera de la escala', rechazada)

  await run(`window.api.projects.remove('${id}')`)
  const huerfanos = withDb((db) =>
    db.prepare('SELECT COUNT(*) AS n FROM findings WHERE project_id = ?').get(id)
  )
  check('borrar el proyecto se lleva sus hallazgos', huerfanos.n === 0, JSON.stringify(huerfanos))

  return results
}
