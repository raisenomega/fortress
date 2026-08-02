/**
 * Lo que el shell del operador ve, la app tiene que verlo tambien, aunque el
 * escritorio la lance con un PATH minimo. Aqui se comprueba justo eso.
 */
const { toolsVisibleFromShell } = require('./path-guard.cjs')

const ID_POR_COMANDO = { git: 'git', claude: 'claude-code' }

const ESPERADAS = toolsVisibleFromShell(Object.keys(ID_POR_COMANDO))

async function checkToolDetection(window) {
  const salud = await window.webContents.executeJavaScript('window.api.health.run()')

  return ESPERADAS.map((comando) => {
    const check = salud.checks.find((item) => item.id === ID_POR_COMANDO[comando])
    return {
      name: `encuentra ${comando} pese al PATH de escritorio`,
      pass: Boolean(check) && check.level === 'ok',
      detail: check ? check.detail : 'sin check'
    }
  })
}

module.exports = { checkToolDetection }
