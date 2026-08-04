/** Modo autonomo con aviso descartable y plegado del sidebar. */
const { clickByText, clickSelector } = require('../checks/ui-scripts.cjs')

async function walkShell(helpers) {
  const { run, missing, pause, shoot, expect } = helpers

  await run(clickByText('autonomo'))
  await pause(400)
  await shoot('-autonomo')
  await expect('modo autonomo', 'sin confirmacion')

  // El aviso se cierra una vez leido y no vuelve hasta reactivar el modo.
  await run(clickSelector('button[aria-label="Cerrar el aviso"]'))
  await pause(300)
  const trasCerrar = await run('document.body.innerText')
  if (trasCerrar.includes('los cambios se aplican sin confirmacion')) {
    missing.push('aviso autonomo: no se cerro')
  }

  // Sidebar plegado: el contenido gana ancho y quedan solo los iconos. Se mira
  // SOLO el <aside>: el superdashboard de OMEGA lista nombres de agente en el
  // <main>, asi que un body.innerText daria un falso "no se plego".
  await run(clickSelector('[data-sidebar-toggle]'))
  await pause(400)
  await shoot('-sidebar-plegado')
  const plegado = await run("document.querySelector('aside')?.innerText || ''")
  if (plegado.includes('Security Reviewer')) missing.push('sidebar: no se plego')
  await run(clickSelector('[data-sidebar-toggle]'))
  await pause(300)
}

module.exports = { walkShell }
