/**
 * Smoke test del renderer: monta la UI real (con preload e IPC vivos) y falla
 * si el arbol React no se pinta, si Tailwind no aplica o si hay errores en
 * consola. Ya ha cazado un bucle de render infinito (React #185), utilidades
 * de Tailwind que no se generaban y un preload ausente.
 *
 * Uso: npm run smoke  ·  guarda .render-smoke.png para inspeccion visual.
 */
const { app } = require('electron')
const { join } = require('path')
const { writeFileSync } = require('fs')
const harness = require('./lib/app-harness.cjs')

const SCREENSHOT = join(__dirname, '..', '.render-smoke.png')
const SETTLE_MS = 2500
const MIN_HTML_LENGTH = 500

harness.useTemporaryUserData()
harness.bootMainProcess()

app.whenReady().then(async () => {
  const errors = []
  const window = harness.createRendererWindow()

  window.webContents.on('console-message', (_event, level, message) => {
    if (level >= 2) errors.push(message)
  })
  window.webContents.on('render-process-gone', (_event, details) => {
    errors.push(`render-process-gone: ${details.reason}`)
  })

  const fail = (reason) => {
    console.error(`SMOKE FAIL: ${reason}`)
    harness.cleanup()
    app.exit(1)
  }

  try {
    await harness.loadRenderer(window)
  } catch (error) {
    return fail(`no se pudo cargar el renderer — ¿falta npm run build? (${error.message})`)
  }

  await new Promise((resolve) => setTimeout(resolve, SETTLE_MS))
  writeFileSync(SCREENSHOT, (await window.webContents.capturePage()).toPNG())

  const html = await window.webContents.executeJavaScript(
    "document.getElementById('root')?.innerHTML.length ?? 0"
  )
  if (html < MIN_HTML_LENGTH) return fail(`el arbol React no se pinto (${html} caracteres)`)

  // Sin utilidades de Tailwind la app renderiza texto plano sin layout.
  const styled = await window.webContents.executeJavaScript(
    "getComputedStyle(document.body).backgroundColor !== 'rgba(0, 0, 0, 0)' &&" +
      "getComputedStyle(document.querySelector('aside')).borderRightWidth !== '0px'"
  )
  if (!styled) return fail('los estilos de Tailwind no se aplicaron')

  if (errors.length > 0) return fail(`errores en consola — ${errors.join(' | ')}`)

  console.log(`SMOKE OK: ${html} caracteres renderizados, 0 errores`)
  harness.cleanup()
  app.exit(0)
})
