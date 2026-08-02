/**
 * Test de integracion de la persistencia. Ejercita el stack completo:
 * renderer -> puente del preload -> IPC -> casos de uso -> SQLite.
 *
 * Uso: npm run test:persistence
 */
const { app } = require('electron')
const harness = require('./lib/app-harness.cjs')
const CHECKS = require('./checks/persistence-checks.cjs')

harness.useTemporaryUserData()
harness.bootMainProcess()

function report(results) {
  let failed = 0
  for (const { name, pass, detail } of results) {
    console.log(`  ${pass ? '✓' : '✗'} ${name}${pass ? '' : ` — ${detail}`}`)
    if (!pass) failed += 1
  }
  console.log(
    failed === 0 ? `\nPERSISTENCE OK: ${results.length} checks` : `\nPERSISTENCE FAIL: ${failed}`
  )
  return failed
}

app.whenReady().then(async () => {
  const window = harness.createRendererWindow()
  let failed = 1

  try {
    await harness.loadRenderer(window)
    failed = report(await window.webContents.executeJavaScript(CHECKS))
  } catch (error) {
    console.error(`PERSISTENCE FAIL: ${error.message}`)
  } finally {
    harness.cleanup()
  }

  app.exit(failed === 0 ? 0 : 1)
})
