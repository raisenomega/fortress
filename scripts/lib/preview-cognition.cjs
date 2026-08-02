/** Panel COGNITION: patrones, atencion y el filtro de plantillas. */
const { clickByText, clickSelector } = require('../checks/ui-scripts.cjs')

async function walkCognition(helpers) {
  const { run, missing, pause, shoot, expect } = helpers

  await run(clickByText('Nucleo'))
  await run(clickSelector('[data-nav="Cognition"]'))
  await pause(500)
  await shoot('-cognition')
  await expect('cognition', 'PTN-2026-001', 'EXTINTO', 'src/auth/', 'GENERACION', 'KNOWLEDGE GRAPH')
  // El bloque EJEMPLO del log no puede acabar en pantalla.
  const texto = await run('document.body.innerText')
  if (texto.includes('inventado/')) missing.push('cognition: zona de EJEMPLO filtrada')
}

module.exports = { walkCognition }
