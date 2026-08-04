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

  // Superficie externa: metes la URL, confirmas que es tuya, sin ataques.
  await run(clickSelector('[data-nav="Superficie externa"]'))
  await pause(500)
  await shoot('-exposicion')
  await expect(
    'exposicion',
    'Superficie externa',
    'sitio es mio',
    'Auditar exposicion',
    'ningun ataque de volumen'
  )

  // Conectores (D3): panel de MCPs con toggles.
  await run(clickSelector('[data-nav="Conectores"]'))
  await pause(500)
  await shoot('-conectores')
  await expect('conectores', 'Figma', 'Canva')

  // Sentinel Omega: superdashboard (metricas, salud de agentes, Libro de la Vida).
  await run(clickSelector('[data-nav="Sentinel Omega"]'))
  await pause(500)
  await shoot('-omega')
  await expect(
    'omega',
    'SENTINEL OMEGA',
    'EL OJO QUE TODO LO VE',
    'FORTRESS v1.0.0',
    'AGENTES DEL SISTEMA',
    'LIBRO DE LA VIDA',
    'Ejecutar auditoria'
  )
}

module.exports = { walkCognition }
