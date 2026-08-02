/** Recorrido por las pantallas de la app, capturando y verificando cada una. */
const { clickByText, clickSelector, TOGGLES_INSIDE_TRACK } = require('../checks/ui-scripts.cjs')
const { walkPerformance } = require('./preview-performance.cjs')
const { walkTimeline } = require('./preview-timeline.cjs')

const SKIP_ONBOARDING = clickByText('Entrar sin configurar')

async function walkScreens(helpers) {
  const { run, missing, pause, shoot, expect } = helpers

  await shoot('')
  await expect('panel', 'Security Reviewer', 'Nucleo', '99', 'Push bloqueado')
  await expect('barra de estado', 'tokens', '$0.20')

  // Los switches de agentes: el circulo debe caer dentro de la pista.
  missing.push(...(await run(TOGGLES_INSIDE_TRACK)))

  // Omega es el que tiene CRITICALs: es donde se ve el bloqueo de verdad.
  await run(clickByText('Omega'))
  await run(clickSelector('[data-nav="Escaneo"]'))
  await pause(500)
  await shoot('-scan')
  await expect('escaneo', 'SQL injection', 'CRITICAL', 'Escanear seguridad', 'Push bloqueado')

  // El nombre del agente abre su detalle; el interruptor no debe activarse.
  await run(clickByText('Security Reviewer'))
  await pause(600)
  await shoot('-agente')
  await expect('detalle del agente', 'EJECUCIONES', 'HALLAZGOS', 'EFECTIVIDAD', 'Omega')
  await run(clickSelector('button[aria-label="Cerrar"]'))
  await pause(300)

  await walkTimeline(helpers)

  await run(clickByText('Nucleo'))
  await run(clickSelector('[data-nav="Cognition"]'))
  await pause(500)
  await shoot('-cognition')
  await expect('cognition', 'PTN-2026-001', 'EXTINTO', 'src/auth/', 'GENERACION')
  // El bloque EJEMPLO del log no puede acabar en pantalla.
  const texto = await run('document.body.innerText')
  if (texto.includes('inventado/')) missing.push('cognition: zona de EJEMPLO filtrada')

  await run(clickSelector('aside button[title="Agregar proyecto"]'))
  await pause(400)
  await shoot('-dialog')
  await expect('dialogo', 'Agregar proyecto a FORTRESS')
  await run(clickSelector('button[aria-label="Cerrar"]'))

  // clickByText mira textContent (crudo); el boton dice 'autonomo' en minusculas
  await run(clickByText('autonomo'))
  await pause(400)
  await shoot('-autonomo')
  await expect('modo autonomo', 'sin confirmacion')

  await walkPerformance(helpers)

  await run(clickSelector('[data-nav="Configuracion"]'))
  await pause(400)
  await shoot('-settings')
  await expect('configuracion', 'API key de Claude', 'Modo de operacion')

  await run(clickSelector('footer button[title="Ver el diagnostico del sistema"]'))
  await pause(400)
  await shoot('-health')
  await expect('diagnostico', 'Diagnostico del sistema', 'Como arreglarlo')
}

module.exports = { walkScreens, SKIP_ONBOARDING }
