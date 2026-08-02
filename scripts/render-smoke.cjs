/**
 * Smoke test del renderer: monta la UI real (con preload e IPC vivos), pasa el
 * onboarding y falla si el shell no se pinta, si Tailwind no aplica o si hay
 * errores en consola.
 *
 * Ya ha cazado un bucle de render infinito (React #185), utilidades de Tailwind
 * que no se generaban, un preload ausente y un cuelgue sin salida.
 *
 * Uso: npm run smoke  ·  guarda .render-smoke.png para inspeccion visual.
 */
const { app } = require('electron')
const { join } = require('path')
const { writeFileSync } = require('fs')
const harness = require('./lib/app-harness.cjs')
const { clickByText } = require('./checks/ui-scripts.cjs')

const SCREENSHOT = join(__dirname, '..', '.render-smoke.png')
const SETTLE_MS = 2500
const MIN_HTML_LENGTH = 2000

// Sin sidebar en el onboarding: la comprobacion mira el contenedor raiz, que
// existe en las dos pantallas, y usa optional chaining para no lanzar nunca.
const TAILWIND_APPLIED = `
  getComputedStyle(document.body).backgroundColor !== 'rgba(0, 0, 0, 0)' &&
  getComputedStyle(document.querySelector('#root > div') ?? document.body).display === 'flex'`

harness.useTemporaryUserData()
harness.bootMainProcess()

function fail(reason) {
  console.error(`SMOKE FAIL: ${reason}`)
  harness.cleanup()
  app.exit(1)
}

app.whenReady().then(async () => {
  const errors = []
  const window = harness.createRendererWindow()
  const run = (script) => window.webContents.executeJavaScript(script)

  window.webContents.on('console-message', (...args) => {
    const detail = args[1]
    const level = typeof detail === 'object' && detail !== null ? detail.level : detail
    if (level === 'error' || level === 'warning' || Number(level) >= 2)
      errors.push(String(args[2] ?? detail?.message))
  })
  window.webContents.on('render-process-gone', (_event, details) => {
    errors.push(`render-process-gone: ${details.reason}`)
  })

  try {
    await harness.loadRenderer(window)
    await new Promise((resolve) => setTimeout(resolve, SETTLE_MS))

    // Sin API key la app abre en el onboarding; se salta para medir el shell.
    await run(clickByText('Entrar sin configurar'))
    await new Promise((resolve) => setTimeout(resolve, 600))

    writeFileSync(SCREENSHOT, (await window.webContents.capturePage()).toPNG())

    const html = await run("document.getElementById('root')?.innerHTML.length ?? 0")
    if (html < MIN_HTML_LENGTH) return fail(`el shell no se pinto (${html} caracteres)`)

    if (!(await run(TAILWIND_APPLIED))) return fail('los estilos de Tailwind no se aplicaron')
    if (errors.length > 0) return fail(`errores en consola — ${errors.join(' | ')}`)
  } catch (error) {
    // Un rechazo sin capturar aqui dejaba el proceso colgado y mudo.
    return fail(`excepcion durante la comprobacion — ${error.message}`)
  }

  console.log('SMOKE OK: shell renderizado, estilos aplicados, 0 errores')
  harness.cleanup()
  app.exit(0)
})
