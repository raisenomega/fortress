/** Recorrido del dashboard de rendimiento. */
const { clickSelector } = require('../checks/ui-scripts.cjs')

async function walkPerformance(helpers) {
  const { run, pause, shoot, expect } = helpers

  await run(clickSelector('[data-nav="Rendimiento"]'))
  await pause(700)
  await shoot('-rendimiento')
  await expect(
    'rendimiento',
    'TOKENS',
    'TOKENS POR PROYECTO',
    'Security Reviewer',
    'CRITICAL',
    'SCORE Y TENDENCIA'
  )
}

module.exports = { walkPerformance }
