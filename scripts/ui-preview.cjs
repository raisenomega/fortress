/**
 * Siembra proyectos y una conversacion, recarga la app y captura la UI con
 * contenido real. Verifica ademas que los chips de agente y proyecto se pintan.
 *
 * Uso: npm run preview  ·  guarda .ui-preview.png
 */
const { app } = require('electron')
const { join } = require('path')
const { writeFileSync } = require('fs')
const harness = require('./lib/app-harness.cjs')
const { simulateScan } = require('./lib/simulate-scan.cjs')
const SEED = require('./checks/seed.cjs')

const SCREENSHOT = join(__dirname, '..', '.ui-preview.png')
const DIALOG_SHOT = join(__dirname, '..', '.ui-preview-dialog.png')
const SETTLE_MS = 2000

const OPEN_ADD_PROJECT = `(() => {
  const button = document.querySelector('aside button[title="Agregar proyecto"]')
  if (!button) return false
  button.click()
  return true
})()`

harness.useTemporaryUserData()
harness.bootMainProcess()

app.whenReady().then(async () => {
  const window = harness.createRendererWindow()
  await harness.loadRenderer(window)

  const seeded = await window.webContents.executeJavaScript(SEED)
  simulateScan()
  await window.webContents.reload()
  await new Promise((resolve) => setTimeout(resolve, SETTLE_MS))

  writeFileSync(SCREENSHOT, (await window.webContents.capturePage()).toPNG())

  const chips = await window.webContents.executeJavaScript(
    "Array.from(document.querySelectorAll('article span')).map((n) => n.textContent).join('|')"
  )

  const expected = ['Security Reviewer', 'Nucleo', 'supervisado']
  const missing = expected.filter((label) => !chips.includes(label))

  // El dialogo de agregar proyecto: se abre sin tocar el selector nativo.
  const opened = await window.webContents.executeJavaScript(OPEN_ADD_PROJECT)
  await new Promise((resolve) => setTimeout(resolve, 400))
  writeFileSync(DIALOG_SHOT, (await window.webContents.capturePage()).toPNG())
  if (!opened) missing.push('dialogo de agregar proyecto')

  harness.cleanup()

  if (missing.length > 0) {
    console.error(`PREVIEW FAIL: faltan chips ${missing.join(', ')} — visto: ${chips}`)
    return app.exit(1)
  }

  console.log(`PREVIEW OK: ${seeded} proyectos sembrados, chips presentes`)
  app.exit(0)
})
