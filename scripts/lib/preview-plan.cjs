/** El plan del workflow tiene que verse ANTES de ejecutar, en supervisado. */
const { clickByText } = require('../checks/ui-scripts.cjs')

async function walkPlan(helpers) {
  const { run, pause, shoot, expect } = helpers

  // El plan del workflow tiene que salir ANTES de ejecutar, en supervisado.
  await run(clickByText('Revisa la seguridad'))
  await pause(600)
  await shoot('-plan')
  await expect(
    'plan de workflow',
    'Revision de seguridad',
    'Security Reviewer',
    'agentes',
    'Ejecutar'
  )
  await run(clickByText('Cancelar'))
  await pause(300)
}

module.exports = { walkPlan }
