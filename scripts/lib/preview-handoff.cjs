/** Del escaneo al chat: la pregunta llega ya escrita. */
const { clickByText, clickSelector } = require('../checks/ui-scripts.cjs')

async function walkHandoff(helpers) {
  const { run, missing, pause, shoot, expect } = helpers

  // Del escaneo al Terminal: la pregunta llega escrita y el boton pasa a Detener.
  await run(clickSelector('[data-nav="Escaneo"]'))
  await pause(400)
  await run(clickByText('Preguntar al Terminal'))
  await pause(500)
  await shoot('-precargado')
  // El valor de un textarea no sale en innerText: hay que leer la propiedad.
  const precargado = await run("document.querySelector('textarea').value")
  if (!precargado.includes('hallazgos abiertos del ultimo escaneo')) {
    missing.push('chat precargado: la pregunta no llego al input')
  }
  await expect('chat precargado', 'Enviar')
}

module.exports = { walkHandoff }
