/**
 * Smoke test del renderer: monta la UI ya compilada dentro de Electron y falla
 * si el arbol React no se pinta o si la consola registra un error.
 *
 * Cazo real: detecto bucles de render infinitos (React #185) y utilidades de
 * Tailwind que no se generan, cosas que typecheck y lint no ven.
 *
 * Uso: npm run smoke  ·  guarda .render-smoke.png para inspeccion visual.
 */
const { app, BrowserWindow } = require('electron')
const { join } = require('path')
const { writeFileSync } = require('fs')

const RENDERER = join(__dirname, '..', 'out', 'renderer', 'index.html')
const SCREENSHOT = join(__dirname, '..', '.render-smoke.png')
const SETTLE_MS = 2500
const MIN_HTML_LENGTH = 500

function fail(reason) {
  console.error(`SMOKE FAIL: ${reason}`)
  app.exit(1)
}

app.whenReady().then(async () => {
  const errors = []
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    webPreferences: { offscreen: true }
  })

  window.webContents.on('console-message', (_event, level, message) => {
    if (level >= 2) errors.push(message)
  })
  window.webContents.on('render-process-gone', (_event, details) => {
    errors.push(`render-process-gone: ${details.reason}`)
  })

  try {
    await window.loadFile(RENDERER)
  } catch (error) {
    return fail(`no se pudo cargar ${RENDERER} — ¿falta npm run build? (${error.message})`)
  }

  await new Promise((resolve) => setTimeout(resolve, SETTLE_MS))

  writeFileSync(SCREENSHOT, (await window.webContents.capturePage()).toPNG())

  const htmlLength = await window.webContents.executeJavaScript(
    "document.getElementById('root')?.innerHTML.length ?? 0"
  )
  if (htmlLength < MIN_HTML_LENGTH) {
    return fail(`el arbol React no se pinto (innerHTML = ${htmlLength} caracteres)`)
  }

  // Sin utilidades de Tailwind la app renderiza texto plano sin layout.
  const hasLayout = await window.webContents.executeJavaScript(
    "getComputedStyle(document.querySelector('main')).display === 'block' &&" +
      "getComputedStyle(document.body).backgroundColor !== 'rgba(0, 0, 0, 0)'"
  )
  if (!hasLayout) return fail('los estilos de Tailwind no se aplicaron')

  if (errors.length > 0) return fail(`errores en consola — ${errors.join(' | ')}`)

  console.log(`SMOKE OK: ${htmlLength} caracteres renderizados, 0 errores`)
  app.exit(0)
})
