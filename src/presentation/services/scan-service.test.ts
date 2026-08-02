import { describe, expect, it } from 'vitest'
import { EMPTY_COUNTS } from '@domain/project/severity-counts'
import { useScanStore } from '../stores/scan-store'
import { runScan } from './scan-service'

const SUMMARY = {
  projectId: 'p1',
  score: 64,
  scannedAt: '2026-08-02T00:00:00.000Z',
  durationMs: 45_000,
  counts: EMPTY_COUNTS
}

let llamadas = 0

/** Puente del preload de mentira: aqui no hay Electron ni proceso principal. */
function stubBridge(run: () => Promise<unknown>): void {
  llamadas = 0
  Object.assign(globalThis, {
    window: {
      api: {
        scan: {
          run: () => {
            llamadas += 1
            return run()
          },
          findings: () => Promise.resolve([]),
          counts: () => Promise.resolve({}),
          onProgress: () => () => {}
        },
        projects: { list: () => Promise.resolve([]) }
      }
    }
  })
}

describe('runScan', () => {
  it('guarda el resumen y suelta el estado cuando va bien', async () => {
    stubBridge(() => Promise.resolve({ ok: true, value: SUMMARY }))
    await runScan('p1')

    expect(useScanStore.getState().lastSummary?.score).toBe(64)
    expect(useScanStore.getState().runningProjectId).toBeNull()
  })

  it('deja el motivo a la vista si el escaneo falla', async () => {
    stubBridge(() => Promise.resolve({ ok: false, error: 'no hay Claude Code' }))
    await runScan('p1')

    expect(useScanStore.getState().error).toBe('no hay Claude Code')
    expect(useScanStore.getState().runningProjectId).toBeNull()
  })

  it('libera el estado aunque el canal IPC reviente', async () => {
    // Sin el catch del servicio, runningProjectId se quedaria en 'p1' y el
    // boton de escanear no volveria a habilitarse en toda la sesion.
    stubBridge(() => Promise.reject(new Error('canal cerrado')))
    await runScan('p1')

    expect(useScanStore.getState().runningProjectId).toBeNull()
    expect(useScanStore.getState().error).toBe('canal cerrado')
  })

  it('no lanza un segundo escaneo mientras hay uno en curso', async () => {
    stubBridge(() => Promise.resolve({ ok: true, value: SUMMARY }))
    useScanStore.getState().startScan('otro-proyecto')

    await runScan('p1')
    expect(llamadas).toBe(0)
  })
})
