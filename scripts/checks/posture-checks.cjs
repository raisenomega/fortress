/** El escaner de exposicion, contra el canal IPC real. */
const { createRecorder } = require('../lib/renderer-checks.cjs')

module.exports = async function postureChecks(window) {
  const { results, check, run } = createRecorder(window)

  const sinPermiso = await run(
    "window.api.posture.run({ url: 'ejemplo.com', depth: 'baja', owned: false })"
  )
  check('sin confirmar propiedad, no audita', !sinPermiso.ok, JSON.stringify(sinPermiso))

  const urlMala = await run(
    "window.api.posture.run({ url: 'file:///etc/passwd', depth: 'baja', owned: true })"
  )
  check('rechaza una direccion que no es web', !urlMala.ok, JSON.stringify(urlMala))

  // El preload NO expone window.electron: filtraba process.env e ipcRenderer crudo.
  check('window.electron no esta expuesto', (await run('typeof window.electron')) === 'undefined')

  return results
}
