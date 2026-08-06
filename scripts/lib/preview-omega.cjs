/** Recorrido de Sentinel Omega en el preview: pestañas y la pagina de un agente. */
const { clickSelector } = require('../checks/ui-scripts.cjs')

async function walkOmega(helpers) {
  const { run, pause, shoot, expect } = helpers

  // Sentinel Omega: superdashboard con pestañas (Agentes por defecto).
  await run(clickSelector('[data-nav="Sentinel Omega"]'))
  await pause(500)
  await shoot('-omega')
  await expect(
    'omega',
    'SENTINEL OMEGA',
    'EL OJO QUE TODO LO VE',
    'FORTRESS v1.0.0',
    'AGENTES DEL SISTEMA',
    'ESTADISTICAS GLOBALES'
  )

  // Pestaña CODIGO: resumen del escaneo + vulnerabilidades por severidad.
  await run(clickSelector('[data-omega-tab="codigo"]'))
  await pause(400)
  await shoot('-omega-codigo')
  await expect(
    'omega codigo',
    'RESUMEN DEL ESCANEO',
    'VULNERABILIDADES POR SEVERIDAD',
    'Escanear ahora'
  )

  // Vuelvo a la pestaña Agentes; click en un badge abre la pagina del agente.
  await run(clickSelector('[data-omega-tab="agentes"]'))
  await pause(300)
  await run(clickSelector('[data-omega-agent="security-reviewer"]'))
  await pause(400)
  await shoot('-omega-agente')
  await expect(
    'omega agente',
    'Volver a agentes',
    'AGENTE SECURITY REVIEWER',
    'EFECTIVIDAD',
    'METRICAS',
    'HISTORIAL DE EJECUCIONES',
    'DISCREPANCIAS DETECTADAS',
    'GRAFICA DE RENDIMIENTO'
  )
}

module.exports = { walkOmega }
