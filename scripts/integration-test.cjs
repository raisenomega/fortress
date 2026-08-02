/**
 * Tests de integracion. Ejercitan el stack completo:
 * renderer -> puente del preload -> IPC -> casos de uso -> SQLite / Anthropic.
 * Corren con el PATH minimo de una app lanzada con doble click, no con el del
 * shell: es la unica forma de detectar herramientas que la app no encuentra.
 */
const { app } = require('electron')
const harness = require('./lib/app-harness.cjs')
const { stripToSystemPath, toolsVisibleFromShell } = require('./lib/path-guard.cjs')

const SUITES = [
  ['Persistencia', require('./checks/persistence-checks.cjs')],
  ['API key y chat', require('./checks/api-key-checks.cjs')],
  ['Modo de operacion', require('./checks/mode-checks.cjs')],
  ['Self-diagnostics', require('./checks/health-checks.cjs')]
]

const ESPERADAS = toolsVisibleFromShell(['git', 'claude'])

harness.useTemporaryUserData()
stripToSystemPath()
harness.bootMainProcess()

function report(title, results) {
  console.log(`\n${title}`)
  let failed = 0
  for (const { name, pass, detail } of results) {
    console.log(`  ${pass ? 'PASS' : 'FAIL'} ${name}${pass ? '' : ` — ${detail}`}`)
    if (!pass) failed += 1
  }
  return failed
}

const ID_POR_COMANDO = { git: 'git', claude: 'claude-code' }

/** Lo que el shell ve, la app tiene que verlo tambien pese al PATH recortado. */
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

app.whenReady().then(async () => {
  const window = harness.createRendererWindow()
  let failed = 1
  let total = 0

  try {
    await harness.loadRenderer(window)
    failed = 0
    for (const [title, checks] of SUITES) {
      const results = await window.webContents.executeJavaScript(checks)
      total += results.length
      failed += report(title, results)
    }
    const herramientas = await checkToolDetection(window)
    total += herramientas.length
    failed += report('Deteccion de herramientas', herramientas)
  } catch (error) {
    console.error(`\nINTEGRATION FAIL: ${error.message}`)
  } finally {
    harness.cleanup()
  }

  console.log(failed === 0 ? `\nINTEGRATION OK: ${total} checks` : `\nINTEGRATION FAIL: ${failed}`)
  app.exit(failed === 0 ? 0 : 1)
})
