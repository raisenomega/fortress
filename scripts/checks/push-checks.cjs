/** El bloqueo de push, ejercitado por el canal IPC y no por el boton. */
const { insertFinding, markScanned } = require('../lib/findings-seed.cjs')
const { makeRepo } = require('../lib/omega-seed.cjs')
const { addProject, createRecorder } = require('../lib/renderer-checks.cjs')
const { createTempRepo, remoteCommits, removeRepo } = require('../lib/temp-repo.cjs')

const REMOTE = 'git@example.com:acme/repo.git'

async function nuevoProyecto(run, nombre, ruta, remoto) {
  const added = await run(addProject(nombre, ruta, remoto))
  return added.ok ? added.value.id : ''
}

module.exports = async function pushChecks(window) {
  const { results, check, run } = createRecorder(window)

  // Cada carpeta es la RAIZ de su propio repo, como en produccion: `push:run`
  // se lo pregunta a git antes de nada, y una ruta que no lo sea se rechaza por
  // ahi — tapando el rechazo que cada check viene a probar.
  const sinRemoto = await nuevoProyecto(run, 'SinRemoto', makeRepo('fortress-push-sin-remoto-'), null) // prettier-ignore
  const r1 = await run(`window.api.push.run('${sinRemoto}')`)
  check('rechaza un proyecto sin remoto', !r1.ok && /remoto/i.test(r1.error), JSON.stringify(r1))

  const sinScan = await nuevoProyecto(run, 'SinScan', makeRepo('fortress-push-sin-scan-'), REMOTE)
  const r2 = await run(`window.api.push.run('${sinScan}')`)
  check('rechaza un proyecto sin escanear', !r2.ok && /escanea/i.test(r2.error), JSON.stringify(r2))

  const conCritical = await nuevoProyecto(run, 'Critical', makeRepo('fortress-push-critical-'), REMOTE) // prettier-ignore
  insertFinding(conCritical, 'CRITICAL', 'SQL injection')
  markScanned(conCritical, 40)
  const r3 = await run(`window.api.push.run('${conCritical}')`)
  check('bloquea el push con un CRITICAL', !r3.ok && /CRITICAL/.test(r3.error), JSON.stringify(r3))

  // Un repo de verdad con remoto: aqui el push puede OCURRIR, y por eso es el
  // unico sitio donde se puede afirmar que descartar desbloquea. Comprobarlo
  // por "el error ya no dice CRITICAL" daba verde con el push fallando por
  // cualquier otra causa — y lo dio, cuando una guarda nueva empezo a rechazar
  // antes de mirar los hallazgos.
  const repo = createTempRepo()
  try {
    const limpio = await nuevoProyecto(run, 'Limpio', repo.dir, REMOTE)
    insertFinding(limpio, 'HIGH', 'falta rate limiting')
    markScanned(limpio, 92)

    const r4 = await run(`window.api.push.run('${limpio}')`)
    check('un HIGH no bloquea el push', r4.ok, JSON.stringify(r4))
    check('el commit llego al remoto', remoteCommits(repo.remote) === 1)

    insertFinding(limpio, 'CRITICAL', 'SQL injection en el repo real')
    const bloqueado = await run(`window.api.push.run('${limpio}')`)
    check('un CRITICAL bloquea tambien el repo real', !bloqueado.ok && /CRITICAL/.test(bloqueado.error), JSON.stringify(bloqueado)) // prettier-ignore

    const suyos = await run(`window.api.scan.findings('${limpio}')`)
    const critico = suyos.find((f) => f.severity === 'CRITICAL')
    await run(`window.api.scan.dismiss('${critico.id}')`)
    const r5 = await run(`window.api.push.run('${limpio}')`)
    check('descartar el CRITICAL desbloquea: el push OCURRE', r5.ok, JSON.stringify(r5))
  } finally {
    removeRepo(repo)
  }

  return results
}
