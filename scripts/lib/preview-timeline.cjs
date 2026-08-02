/** Recorrido del timeline: feed con datos y feed filtrado a vacio. */
const { clickSelector } = require('../checks/ui-scripts.cjs')

async function walkTimeline(helpers) {
  const { run, pause, shoot, expect } = helpers

  await run(clickSelector('[data-nav="Actividad"]'))
  await pause(500)
  await shoot('-timeline')
  await expect('timeline', 'SQL injection', 'Security Reviewer', 'Todos los agentes')

  // Filtrar por un agente que no ha hecho nada deja el feed vacio, con motivo.
  await run(`(() => {
    const select = document.querySelector('select[aria-label="Filtrar por agente"]')
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set
    setter.call(select, 'planner')
    select.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  })()`)
  await pause(300)
  await expect('timeline filtrado', 'Ninguna entrada cumple ese filtro')
}

module.exports = { walkTimeline }
