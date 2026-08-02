/** Dialogo de agregar proyecto. */
const { clickByText, clickSelector } = require('../checks/ui-scripts.cjs')

async function walkDialog(helpers) {
  const { run, pause, shoot, expect } = helpers

  await run(clickSelector('aside button[title="Agregar proyecto"]'))
  await pause(400)
  await shoot('-dialog')
  await expect('dialogo', 'Conectar un proyecto existente', 'Crear un proyecto desde cero')

  // Crear desde cero: la ruta final tiene que verse ANTES de crear nada.
  await run(clickByText('Crear un proyecto desde cero'))
  await pause(400)
  await run(`(() => {
    const input = document.querySelector('input[placeholder="Mi App Genial"]')
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(input, 'Mi App Genial')
    input.dispatchEvent(new Event('input', { bubbles: true }))
    return true
  })()`)
  await pause(600)
  await shoot('-nuevo-proyecto')
  await expect('nuevo proyecto', 'SE CREARA EN', 'mi-app-genial', 'Crear la carpeta')

  await run(clickSelector('button[aria-label="Cerrar"]'))

  // clickByText mira textContent (crudo); el boton dice 'autonomo' en minusculas
}

module.exports = { walkDialog }
