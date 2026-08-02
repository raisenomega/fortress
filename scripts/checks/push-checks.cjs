/** El bloqueo de push, ejercitado por el canal IPC y no por el boton. */
const { insertFinding, markScanned } = require('../lib/findings-seed.cjs')
const { addProject, createRecorder } = require('../lib/renderer-checks.cjs')
const { createTempRepo, remoteCommits, removeRepo } = require('../lib/temp-repo.cjs')

const REMOTE = 'git@example.com:acme/repo.git'

async function nuevoProyecto(run, nombre, ruta, remoto) {
  const added = await run(addProject(nombre, ruta, remoto))
  return added.ok ? added.value.id : ''
}

module.exports = async function pushChecks(window) {
  const { results, check, run } = createRecorder(window)

  const sinRemoto = await nuevoProyecto(run, 'SinRemoto', '/tmp/fortress-push-sin-remoto', null)
  const r1 = await run(`window.api.push.run('${sinRemoto}')`)
  check('rechaza un proyecto sin remoto', !r1.ok && /remoto/i.test(r1.error), JSON.stringify(r1))

  const sinScan = await nuevoProyecto(run, 'SinScan', '/tmp/fortress-push-sin-scan', REMOTE)
  const r2 = await run(`window.api.push.run('${sinScan}')`)
  check('rechaza un proyecto sin escanear', !r2.ok && /escanea/i.test(r2.error), JSON.stringify(r2))

  const conCritical = await nuevoProyecto(run, 'Critical', '/tmp/fortress-push-critical', REMOTE)
  insertFinding(conCritical, 'CRITICAL', 'SQL injection')
  markScanned(conCritical, 40)
  const r3 = await run(`window.api.push.run('${conCritical}')`)
  check('bloquea el push con un CRITICAL', !r3.ok && /CRITICAL/.test(r3.error), JSON.stringify(r3))

  // Descartar el CRITICAL como falso positivo tiene que desbloquear: si no,
  // el descarte seria un adorno sin consecuencias.
  const hallazgos = await run(`window.api.scan.findings('${conCritical}')`)
  await run(`window.api.scan.dismiss('${hallazgos[0].id}')`)
  const r3b = await run(`window.api.push.run('${conCritical}')`)
  check(
    'descartar el CRITICAL desbloquea el push',
    !/CRITICAL/.test(r3b.error ?? ''),
    JSON.stringify(r3b)
  )

  // Un repo de verdad: si el bloqueo no aplica, el push tiene que ocurrir.
  const repo = createTempRepo()
  try {
    const limpio = await nuevoProyecto(run, 'Limpio', repo.dir, REMOTE)
    insertFinding(limpio, 'HIGH', 'falta rate limiting')
    markScanned(limpio, 92)

    const r4 = await run(`window.api.push.run('${limpio}')`)
    check('un HIGH no bloquea el push', r4.ok, JSON.stringify(r4))
    check('el commit llego al remoto', remoteCommits(repo.remote) === 1)
  } finally {
    removeRepo(repo)
  }

  return results
}
