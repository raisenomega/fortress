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
  await expect('nuevo proyecto', 'SE CREARA EN', 'mi-app-genial', 'Crear proyecto')

  await run(clickSelector('button[aria-label="Cerrar"]'))

  // Quitar proyecto: la X abre confirmacion; se cancela para no borrar la siembra.
  await run(clickSelector('aside button[aria-label^="Quitar"]'))
  await pause(400)
  await shoot('-quitar-proyecto')
  await expect('quitar proyecto', 'su chat, sus hallazgos', 'no se toca', 'Quitar proyecto')
  await run(clickByText('Cancelar'))
  await pause(300)
}

module.exports = { walkDialog }
