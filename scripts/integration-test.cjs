/**
 * Tests de integracion. Ejercitan el stack completo:
 * renderer -> puente del preload -> IPC -> casos de uso -> SQLite / Anthropic.
 *
 * Uso: npm run test
 */
const { app } = require('electron')
const harness = require('./lib/app-harness.cjs')

const SUITES = [
  ['Persistencia', require('./checks/persistence-checks.cjs')],
  ['API key y chat', require('./checks/api-key-checks.cjs')],
  ['Modo de operacion', require('./checks/mode-checks.cjs')],
  ['Self-diagnostics', require('./checks/health-checks.cjs')]
]

harness.useTemporaryUserData()
harness.bootMainProcess()

function report(title, results) {
  console.log(`\n${title}`)
  let failed = 0
  for (const { name, pass, detail } of results) {
    console.log(`  ${pass ? '✓' : '✗'} ${name}${pass ? '' : ` — ${detail}`}`)
    if (!pass) failed += 1
  }
  return failed
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
  } catch (error) {
    console.error(`\nINTEGRATION FAIL: ${error.message}`)
  } finally {
    harness.cleanup()
  }

  console.log(failed === 0 ? `\nINTEGRATION OK: ${total} checks` : `\nINTEGRATION FAIL: ${failed}`)
  app.exit(failed === 0 ? 0 : 1)
})
