import { beforeEach, describe, expect, it } from 'vitest'
import { NADA_SIN_MEDIR } from '@domain/telemetry/sin-factura'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { useTelemetryStore } from '../stores/telemetry-store'
import { refreshSessionUsage } from './telemetry-service'

const MEDIDO = { ...EMPTY_USAGE, outputTokens: 4000, costUsd: 93.34 }
const SIN_MEDIR = { runs: 2, durationMs: 1_800_118 }

/** Doble del puente: fuera de Electron no existe `window.api`. */
function puente(sinFactura: unknown): void {
  Object.assign(globalThis, {
    window: {
      api: {
        telemetry: {
          session: () => Promise.resolve(MEDIDO),
          sinFactura: () => Promise.resolve(sinFactura)
        }
      }
    }
  })
}

beforeEach(() => {
  useTelemetryStore.setState({ session: EMPTY_USAGE, sinMedir: NADA_SIN_MEDIR })
})

describe('el pie lee el total y lo que el total no cuenta, a la vez', () => {
  it('guarda las dos cifras, cada una en su sitio', async () => {
    puente(SIN_MEDIR)
    await refreshSessionUsage()

    expect(useTelemetryStore.getState().session.costUsd).toBe(93.34)
    expect(useTelemetryStore.getState().sinMedir).toEqual(SIN_MEDIR)
  })

  it('el total medido NO se altera: no se le suma nada inventado', async () => {
    // Es la regla de la pieza. El dinero de las corridas sin factura no existe
    // en ningun sitio, asi que el total sigue siendo exactamente lo medido.
    puente(SIN_MEDIR)
    await refreshSessionUsage()

    expect(useTelemetryStore.getState().session).toEqual(MEDIDO)
  })

  it('sin corridas sin medir, el estado queda limpio', async () => {
    puente(NADA_SIN_MEDIR)
    await refreshSessionUsage()

    expect(useTelemetryStore.getState().sinMedir.runs).toBe(0)
  })
})
