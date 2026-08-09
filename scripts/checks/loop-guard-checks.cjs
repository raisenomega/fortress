/**
 * D0.b — el loop autonomo JAMAS corre sobre el propio repo de FORTRESS, y su
 * gate vive en el MAIN. Se intenta encender por el stack real (renderer ->
 * preload -> IPC -> caso de uso) y se comprueba que cada red lo para. Ninguna
 * via arranca un loop de verdad: todas deben morir en el gate.
 */
const { app } = require('electron')
const { join } = require('path')
const Database = require('better-sqlite3')
const { addProject, createRecorder } = require('../lib/renderer-checks.cjs')

function withDb(work) {
  const db = new Database(join(app.getPath('userData'), 'fortress.db'))
  try {
    return work(db)
  } finally {
    db.close()
  }
}

module.exports = async function loopGuardChecks(window) {
  const { results, check, run } = createRecorder(window)

  // Un repo ajeno CON confianza pero SIN topes: pared de topes, en el main.
  const ajeno = await run(addProject('Ajeno loop', '/tmp/fortress-loop-ajeno', null))
  await run(`window.api.projects.setTrusted('${ajeno.value.id}', true)`)
  const sinTopes = await run(`window.api.projects.setLoopEnabled('${ajeno.value.id}', true)`)
  check('sin topes guardados el main RECHAZA', !sinTopes.ok && /topes/.test(sinTopes.error))

  await run(`window.api.settings.set('loop_cost_cap_usd', '5')`)
  await run(`window.api.settings.set('loop_max_cycles', '3')`)

  // Un repo ajeno SIN confianza, con topes: pared de confianza, en el main.
  const crudo = await run(addProject('Sin confianza', '/tmp/fortress-loop-crudo', null))
  const sinConfianza = await run(`window.api.projects.setLoopEnabled('${crudo.value.id}', true)`)
  check('sin confianza el main RECHAZA', !sinConfianza.ok && /confianza/.test(sinConfianza.error))

  // El PROPIO repo, con confianza Y topes en regla: la pared incondicional.
  const self = await run('window.api.projects.self()')
  check('la app reconoce su propio repo', self !== null && typeof self.path === 'string')
  const propio = await run(
    `window.api.projects.add({ name: 'FORTRESS (self)', path: ${JSON.stringify(self.path)},
      stack: 'Electron', gitRemote: null, gitBranch: 'main', hasClaude: true })`
  )
  await run(`window.api.projects.setTrusted('${propio.value.id}', true)`)
  const encendido = await run(`window.api.projects.setLoopEnabled('${propio.value.id}', true)`)
  check('el repo PROPIO se RECHAZA aunque todo este en regla', !encendido.ok && /propio repo/.test(encendido.error)) // prettier-ignore

  const fila = withDb((db) =>
    db.prepare('SELECT loop_enabled FROM projects WHERE id = ?').get(propio.value.id)
  )
  check('el flag del repo propio NO quedo encendido', fila.loop_enabled === 0)

  // Revocar la confianza APAGA el loop: se fuerza el flag en la base (como si
  // un loop hubiera quedado habilitado de antes) y se revoca por el canal real.
  withDb((db) =>
    db.prepare('UPDATE projects SET loop_enabled = 1 WHERE id = ?').run(ajeno.value.id)
  )
  await run(`window.api.projects.setTrusted('${ajeno.value.id}', false)`)
  const trasRevocar = withDb((db) =>
    db.prepare('SELECT loop_enabled FROM projects WHERE id = ?').get(ajeno.value.id)
  )
  check('revocar la confianza apaga el flag del loop', trasRevocar.loop_enabled === 0)

  return results
}
