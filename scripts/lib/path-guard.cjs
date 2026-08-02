/**
 * Reproduce en los tests el PATH que hereda la app al abrirse con doble click:
 * el minimo del sistema, sin nvm ni ~/.local/bin.
 *
 * Sin esto los tests corren con el PATH del shell, que ya lo trae todo, y no
 * detectarian que la app no encuentra `claude`. Paso: el diagnostico daba
 * Claude Code por no instalado estando instalado.
 */
const { spawnSync } = require('child_process')

const SYSTEM_PATH = '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'

/** Herramientas que el shell si encuentra, para exigirlas luego a la app. */
function toolsVisibleFromShell(names) {
  return names.filter((name) => {
    const probe = spawnSync(name, ['--version'], { encoding: 'utf8', timeout: 5000 })
    return !probe.error && probe.status === 0
  })
}

function stripToSystemPath() {
  process.env.PATH = SYSTEM_PATH
}

module.exports = { SYSTEM_PATH, stripToSystemPath, toolsVisibleFromShell }
