/**
 * Verificacion del escaner real. No entra en `npm test` porque lanza un
 * escaneo de verdad con Claude Code y tarda minutos; se ejecuta a mano cuando
 * se toca el escaner, con `npm run verify:scan`.
 *
 * Aqui NO se recorta el PATH: hace falta encontrar `claude` como lo encuentra
 * la app instalada.
 */
const { app } = require('electron')
const harness = require('./lib/app-harness.cjs')
const { report } = require('./lib/suite-runner.cjs')
const realScanChecks = require('./checks/real-scan-checks.cjs')
const { createVulnerableFixture, removeFixture } = require('./lib/vulnerable-fixture.cjs')

harness.useTemporaryUserData()
harness.bootMainProcess()

app.whenReady().then(async () => {
  const window = harness.createRendererWindow()
  const fixture = createVulnerableFixture()
  let failed = 1

  console.log(`Proyecto vulnerable en ${fixture}`)

  try {
    await harness.loadRenderer(window)
    const results = await realScanChecks(window, fixture)
    failed = report('Escaneo real', results)
  } catch (error) {
    console.error(`\nSCAN FAIL: ${error.message}`)
  } finally {
    removeFixture(fixture)
    harness.cleanup()
  }

  console.log(failed === 0 ? '\nSCAN OK' : `\nSCAN FAIL: ${failed}`)
  app.exit(failed === 0 ? 0 : 1)
})
