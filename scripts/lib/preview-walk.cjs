/** Recorrido por las pantallas de la app, capturando y verificando cada una. */
const { clickByText, clickSelector, TOGGLES_INSIDE_TRACK } = require('../checks/ui-scripts.cjs')
const { walkPerformance } = require('./preview-performance.cjs')
const { walkCognition } = require('./preview-cognition.cjs')
const { walkDialog } = require('./preview-dialog.cjs')
const { walkHandoff } = require('./preview-handoff.cjs')
const { walkShell } = require('./preview-shell.cjs')
const { walkTimeline } = require('./preview-timeline.cjs')

const SKIP_ONBOARDING = clickByText('Entrar sin configurar')

async function walkScreens(helpers) {
  const { run, missing, pause, shoot, expect } = helpers

  await shoot('')
  await expect('panel', 'Security Reviewer', 'Nucleo', '99', 'Push bloqueado')
  await expect('barra de estado', 'tokens', '$0.20')

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

  await walkHandoff(helpers)

  await walkTimeline(helpers)

  await walkCognition(helpers)

  await walkDialog(helpers)

  await walkShell(helpers)

  await walkPerformance(helpers)

  // Configuracion vive solo en el pie del sidebar; el header ya no la repite.
  await run(clickSelector('[data-nav="Configuracion"]'))
  await pause(400)
  await shoot('-settings')
  await expect('configuracion', 'Cuenta de Claude', 'Mi cuenta de Claude', 'API key de Claude', 'Topes de gasto')

  await run(clickSelector('footer button[title="Ver el diagnostico del sistema"]'))
  await pause(400)
  await shoot('-health')
  await expect('diagnostico', 'Diagnostico del sistema', 'Como arreglarlo')
}

module.exports = { walkScreens, SKIP_ONBOARDING }
