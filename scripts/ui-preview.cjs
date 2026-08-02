/**
 * Siembra proyectos y una conversacion, recarga la app y captura la UI con
 * contenido real. Verifica que los chips, los scores, el dialogo de agregar
 * proyecto y el aviso de modo autonomo se pintan de verdad.
 *
 * Uso: npm run preview  ·  guarda .ui-preview*.png
 */
const { app } = require('electron')
const { join } = require('path')
const { writeFileSync } = require('fs')
const harness = require('./lib/app-harness.cjs')
const { simulateScan } = require('./lib/simulate-scan.cjs')
const SEED = require('./checks/seed.cjs')

const SETTLE_MS = 2000
const clickScript = (selector) =>
  `(() => { const el = document.querySelector(${JSON.stringify(selector)})
            if (!el) return false
            el.click()
            return true })()`

harness.useTemporaryUserData()
harness.bootMainProcess()

app.whenReady().then(async () => {
  const window = harness.createRendererWindow()
  const run = (script) => window.webContents.executeJavaScript(script)
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const shoot = async (suffix) =>
    writeFileSync(
      join(__dirname, '..', `.ui-preview${suffix}.png`),
      (await window.webContents.capturePage()).toPNG()
    )

  await harness.loadRenderer(window)
  const seeded = await run(SEED)
  simulateScan()
  await window.webContents.reload()
  await pause(SETTLE_MS)
  await shoot('')

  const missing = []
  const text = await run('document.body.innerText')
  for (const label of ['Security Reviewer', 'Nucleo', '92', '58', 'Push bloqueado']) {
    if (!text.includes(label)) missing.push(label)
  }

  if (!(await run(clickScript('aside button[title="Agregar proyecto"]')))) {
    missing.push('dialogo de agregar proyecto')
  }
  await pause(400)
  await shoot('-dialog')
  await run(clickScript('button[aria-label="Cerrar"]'))

  await run(clickScript('header button[aria-pressed="false"]'))
  await pause(400)
  await shoot('-autonomo')
  if (!(await run('document.body.innerText')).includes('sin confirmacion')) {
    missing.push('aviso de modo autonomo')
  }

  harness.cleanup()

  if (missing.length > 0) {
    console.error(`PREVIEW FAIL: falta ${missing.join(', ')}`)
    return app.exit(1)
  }

  console.log(`PREVIEW OK: ${seeded} proyectos, chips, scores, dialogo y aviso presentes`)
  app.exit(0)
})
