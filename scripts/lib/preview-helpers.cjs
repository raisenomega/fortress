/** Utilidades del script de preview: capturas y asercion de texto en pantalla. */
const { join } = require('path')
const { writeFileSync } = require('fs')
const { BODY_TEXT } = require('../checks/ui-scripts.cjs')

function createHelpers(window) {
  const run = (script) => window.webContents.executeJavaScript(script)
  const missing = []

  return {
    run,
    missing,

    pause: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

    shoot: async (suffix) =>
      writeFileSync(
        join(__dirname, '..', '..', `.ui-preview${suffix}.png`),
        (await window.webContents.capturePage()).toPNG()
      ),

    /** Falla si alguno de los fragmentos no aparece en la pantalla actual. */
    expect: async (screen, ...fragments) => {
      const text = await run(BODY_TEXT)
      for (const fragment of fragments) {
        if (!text.includes(fragment)) missing.push(`${screen}: "${fragment}"`)
      }
    }
  }
}

module.exports = { createHelpers }
