/**
 * Tests de integracion. Ejercitan el stack completo:
 * renderer -> puente del preload -> IPC -> casos de uso -> SQLite / git.
 * Corren con el PATH minimo de una app lanzada con doble click, no con el del
 * shell: es la unica forma de detectar herramientas que la app no encuentra.
 */
const { app } = require('electron')
const harness = require('./lib/app-harness.cjs')
const { stripToSystemPath } = require('./lib/path-guard.cjs')
const { report, runSuite } = require('./lib/suite-runner.cjs')
const { checkToolDetection } = require('./lib/tool-detection.cjs')

const SUITES = [
  ['Persistencia', require('./checks/persistence-checks.cjs')],
  ['Auto-mejora (sistema)', require('./checks/system-checks.cjs')],
  ['API key y chat', require('./checks/api-key-checks.cjs')],
  ['Superficie externa', require('./checks/posture-checks.cjs')],
  ['Lista blanca de settings', require('./checks/settings-allowlist-checks.cjs')],
  ['Modo de operacion', require('./checks/mode-checks.cjs')],
  ['Self-diagnostics', require('./checks/health-checks.cjs')],
  ['Hallazgos', require('./checks/scan-checks.cjs')],
  ['Cognition', require('./checks/cognition-checks.cjs')],
  ['Descartes e historico', require('./checks/dismissal-checks.cjs')],
  ['Push bloqueado por CRITICAL', require('./checks/push-checks.cjs')],
  ['Loop blindado (gate en el main)', require('./checks/loop-guard-checks.cjs')],
  ['Motor de reparacion (I1)', require('./checks/repair-checks.cjs')],
  ['Libro de vida (I1.5-b)', require('./checks/repair-events-checks.cjs')],
  ['Grafo reconciliado (I1.5-a)', require('./checks/graph-reindex-checks.cjs')],
  ['Generacion C3 (I2)', require('./checks/repair-generate-checks.cjs')],
  ['Gate hermetico (I3)', require('./checks/repair-gate-checks.cjs')],
  ['OMEGA sobre el diff (I4)', require('./checks/repair-omega-checks.cjs')],
  ['Reintento explicito (I4.2)', require('./checks/repair-retry-checks.cjs')],
  ['Libro de la Vida (OMEGA)', require('./checks/omega-checks.cjs')],
  ['Puntuacion y veto (OMEGA)', require('./checks/omega-score-checks.cjs')],
  ['Crear proyecto desde cero', require('./checks/newproject-checks.cjs')]
]

harness.useTemporaryUserData()
stripToSystemPath()
harness.bootMainProcess()

app.whenReady().then(async () => {
  const window = harness.createRendererWindow()
  let failed = 1
  let total = 0

  try {
    await harness.loadRenderer(window)
    failed = 0

    for (const [title, checks] of SUITES) {
      const results = await runSuite(window, checks)
      total += results.length
      failed += report(title, results)
    }

    const herramientas = await checkToolDetection(window)
    total += herramientas.length
    failed += report('Deteccion de herramientas', herramientas)
  } catch (error) {
    // Una suite que LANZA debe hacer fallar la corrida: sin esto, failed seguia
    // en 0 (se pone a 0 antes del bucle) y se imprimia OK pese a la excepcion.
    failed += 1
    console.error(`\nINTEGRATION FAIL: ${error.message}`)
  } finally {
    harness.cleanup()
  }

  console.log(failed === 0 ? `\nINTEGRATION OK: ${total} checks` : `\nINTEGRATION FAIL: ${failed}`)
  app.exit(failed === 0 ? 0 : 1)
})
