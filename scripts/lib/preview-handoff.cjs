/** Del escaneo al Terminal: el borrador llega ya escrito. */
const { clickSelector } = require('../checks/ui-scripts.cjs')

async function walkHandoff(helpers) {
  const { run, missing, pause, shoot, expect } = helpers

  // Del escaneo al Terminal: el borrador llega escrito. La puerta es «Resolver
  // en Terminal» de la fila (ADR-088, pieza 2) — el mismo puente por el que
  // entraba «Preguntar al Terminal», que se retiro por confundir con el lote.
  await run(clickSelector('[data-nav="Escaneo"]'))
  await pause(400)
  await run(clickSelector('[aria-label="Resolver en Terminal"]'))
  await pause(500)
  await shoot('-precargado')
  // El valor de un textarea no sale en innerText: hay que leer la propiedad.
  const precargado = await run("document.querySelector('textarea').value")
  if (!precargado.includes('Resuelve este hallazgo')) {
    missing.push('chat precargado: el borrador no llego al input')
  }
  await expect('chat precargado', 'Enviar')
}

module.exports = { walkHandoff }
