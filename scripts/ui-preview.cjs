/**
 * Recorre la app real y captura cada pantalla, fallando si alguna no se pinta.
 * Cubre onboarding, panel multi-proyecto, escaneo con hallazgos, dialogo de
 * agregar, modo autonomo, configuracion y diagnostico.
 *
 * Uso: npm run preview  ·  guarda .ui-preview*.png
 */
const { app } = require('electron')
const harness = require('./lib/app-harness.cjs')
const { createHelpers } = require('./lib/preview-helpers.cjs')
const { simulateScan } = require('./lib/simulate-scan.cjs')
const { SKIP_ONBOARDING, walkScreens } = require('./lib/preview-walk.cjs')
const SEED = require('./checks/seed.cjs')

harness.useTemporaryUserData()
harness.bootMainProcess()

app.whenReady().then(async () => {
  const window = harness.createRendererWindow()
  const helpers = createHelpers(window)
  const { run, missing, pause, shoot, expect } = helpers

  await harness.loadRenderer(window)
  await pause(1500)
  await shoot('-onboarding')
  await expect('onboarding', 'Pega tu API key para empezar', 'nunca sale de tu maquina')

  await run(SKIP_ONBOARDING)
  const seeded = await run(SEED)
  simulateScan()

  // Recarga para que el renderer lea los hallazgos recien sembrados.
  await window.webContents.reload()
  await pause(2000)
  await run(SKIP_ONBOARDING)
  await pause(300)

  await walkScreens(helpers)
  harness.cleanup()

  if (missing.length > 0) {
    console.error(`PREVIEW FAIL: falta ${missing.join(' | ')}`)
    return app.exit(1)
  }
  console.log(`PREVIEW OK: ${seeded} proyectos, 7 pantallas verificadas`)
  app.exit(0)
})
