/** Dialogo de agregar proyecto. */
const { clickSelector } = require('../checks/ui-scripts.cjs')

async function walkDialog(helpers) {
  const { run, pause, shoot, expect } = helpers

  await run(clickSelector('aside button[title="Agregar proyecto"]'))
  await pause(400)
  await shoot('-dialog')
  await expect('dialogo', 'Agregar proyecto a FORTRESS')
  await run(clickSelector('button[aria-label="Cerrar"]'))

  // clickByText mira textContent (crudo); el boton dice 'autonomo' en minusculas
}

module.exports = { walkDialog }
