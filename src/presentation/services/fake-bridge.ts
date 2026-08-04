import { EMPTY_SNAPSHOT } from '@domain/cognition/cognition-log'
import { EMPTY_COUNTS } from '@domain/project/severity-counts'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'

/**
 * Doble del puente del preload. Solo lo usan los tests de los servicios: fuera
 * de Electron no existe `window.api`, y sin esto la capa de servicios no se
 * podria probar sin levantar la app entera.
 */
export const SCAN_SUMMARY = {
  projectId: 'p1',
  score: 64,
  scannedAt: '2026-08-02T00:00:00.000Z',
  durationMs: 45_000,
  counts: EMPTY_COUNTS
}

export interface BridgeSpy {
  /** Veces que se pidio un escaneo al proceso principal. */
  calls: number
  /** Veces que se releyo COGNITION-LOG.md (debe pasar tras cada escaneo). */
  cognitionReads: number
}

export function stubBridge(run: () => Promise<unknown>): BridgeSpy {
  const spy: BridgeSpy = { calls: 0, cognitionReads: 0 }

  Object.assign(globalThis, {
    window: {
      api: {
        scan: {
          run: () => {
            spy.calls += 1
            return run()
          },
          findings: () => Promise.resolve([]),
          counts: () => Promise.resolve({}),
          onProgress: () => () => {}
        },
        projects: { list: () => Promise.resolve([]) },
        telemetry: { session: () => Promise.resolve(EMPTY_USAGE) },
        activity: { byProject: () => Promise.resolve([]) },
        cognition: {
          read: () => {
            spy.cognitionReads += 1
            return Promise.resolve(EMPTY_SNAPSHOT)
          }
        }
      }
    }
  })

  return spy
}
