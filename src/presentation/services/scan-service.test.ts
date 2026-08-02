import { describe, expect, it } from 'vitest'
import { useScanStore } from '../stores/scan-store'
import { SCAN_SUMMARY, stubBridge } from './fake-bridge'
import { runScan } from './scan-service'

describe('runScan', () => {
  it('guarda el resumen y suelta el estado cuando va bien', async () => {
    stubBridge(() => Promise.resolve({ ok: true, value: SCAN_SUMMARY }))
    await runScan('p1')

    expect(useScanStore.getState().lastSummary?.score).toBe(64)
    expect(useScanStore.getState().runningProjectId).toBeNull()
  })

  it('ata el error al proyecto que lo produjo', async () => {
    // Global, el error de un proyecto se quedaba colgado en la pantalla de
    // otro, atribuyendole un fallo que no era suyo.
    stubBridge(() => Promise.resolve({ ok: false, error: 'no hay Claude Code' }))
    await runScan('p1')

    expect(useScanStore.getState().lastError).toEqual({
      projectId: 'p1',
      message: 'no hay Claude Code'
    })
    expect(useScanStore.getState().runningProjectId).toBeNull()
  })

  it('libera el estado aunque el canal IPC reviente', async () => {
    // Sin el catch del servicio, runningProjectId se quedaria en 'p1' y el
    // boton de escanear no volveria a habilitarse en toda la sesion.
    stubBridge(() => Promise.reject(new Error('canal cerrado')))
    await runScan('p1')

    expect(useScanStore.getState().runningProjectId).toBeNull()
    expect(useScanStore.getState().lastError?.message).toBe('canal cerrado')
  })

  it('no lanza un segundo escaneo mientras hay uno en curso', async () => {
    const spy = stubBridge(() => Promise.resolve({ ok: true, value: SCAN_SUMMARY }))
    useScanStore.getState().startScan('otro-proyecto')

    await runScan('p1')
    expect(spy.calls).toBe(0)
  })
})
