const { mkdtempSync, writeFileSync } = require('fs')
const { tmpdir } = require('os')
const { join } = require('path')

/**
 * Guard del repo propio: EDITAR (Ejecutor) sobre el repo de FORTRESS se bloquea;
 * conversar/investigar (solo lectura) NO. El corte de Ejecutor ocurre ANTES de
 * invocar al agente, asi que es determinista y sin red. Se simula la identidad
 * propia con un package.json que declara el nombre del paquete de FORTRESS.
 */
module.exports = async function buildGuardCheck(run, check) {
  const selfDir = mkdtempSync(join(tmpdir(), 'fortress-self-'))
  writeFileSync(join(selfDir, 'package.json'), JSON.stringify({ name: 'fortress-command-center' }))
  const regSelf = await run(
    `window.api.newProject.register({ name: 'SelfRepo', path: '${selfDir}', stack: '' })`
  )
  const blocked = await run(`window.api.build.feature('${regSelf.value.id}', 'x', 'plan x')`)
  check(
    'Ejecutor bloqueado sobre el propio repo de FORTRESS',
    !blocked.ok && /EDITAR el propio repo/.test(blocked.error),
    JSON.stringify(blocked)
  )
}
