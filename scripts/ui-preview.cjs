/**
 * Recorre la app real y captura cada pantalla, fallando si alguna no se pinta.
 * Cubre onboarding, panel multi-proyecto, dialogo de agregar, modo autonomo y
 * configuracion.
 *
 * Uso: npm run preview  ·  guarda .ui-preview*.png
 */
const { app } = require('electron')
const harness = require('./lib/app-harness.cjs')
const { createHelpers } = require('./lib/preview-helpers.cjs')
const { simulateScan } = require('./lib/simulate-scan.cjs')
const { clickByText, clickSelector, TOGGLES_INSIDE_TRACK } = require('./checks/ui-scripts.cjs')
const SEED = require('./checks/seed.cjs')

const SKIP_ONBOARDING = clickByText('Entrar sin configurar')

harness.useTemporaryUserData()
harness.bootMainProcess()

app.whenReady().then(async () => {
  const window = harness.createRendererWindow()
  const { run, missing, pause, shoot, expect } = createHelpers(window)

  await harness.loadRenderer(window)
  await pause(1500)
  await shoot('-onboarding')
  await expect('onboarding', 'Pega tu API key para empezar', 'nunca sale de tu maquina')

  await run(SKIP_ONBOARDING)
  const seeded = await run(SEED)
  simulateScan()
  await window.webContents.reload()
  await pause(2000)
  await run(SKIP_ONBOARDING)
  await pause(300)
  await shoot('')
  await expect('panel', 'Security Reviewer', 'Nucleo', '92', 'Push bloqueado')

  // Los switches de agentes: el circulo debe caer dentro de la pista.
  missing.push(...(await run(TOGGLES_INSIDE_TRACK)))

  await run(clickSelector('aside button[title="Agregar proyecto"]'))
  await pause(400)
  await shoot('-dialog')
  await expect('dialogo', 'Agregar proyecto a FORTRESS')
  await run(clickSelector('button[aria-label="Cerrar"]'))

  await run(clickSelector('header button[aria-pressed="false"]'))
  await pause(400)
  await shoot('-autonomo')
  await expect('modo autonomo', 'sin confirmacion')

  await run(clickByText('Configuracion'))
  await pause(400)
  await shoot('-settings')
  await expect('configuracion', 'API key de Claude', 'Modo de operacion')

  await run(clickSelector('footer button[title="Ver el diagnostico del sistema"]'))
  await pause(400)
  await shoot('-health')
  await expect('diagnostico', 'Diagnostico del sistema', 'Como arreglarlo')

  harness.cleanup()

  if (missing.length > 0) {
    console.error(`PREVIEW FAIL: falta ${missing.join(' | ')}`)
    return app.exit(1)
  }
  console.log(`PREVIEW OK: ${seeded} proyectos, 6 pantallas verificadas`)
  app.exit(0)
})
