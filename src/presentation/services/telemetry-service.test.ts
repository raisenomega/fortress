import { beforeEach, describe, expect, it } from 'vitest'
import { NADA_SIN_MEDIR } from '@domain/telemetry/sin-factura'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { useTelemetryStore } from '../stores/telemetry-store'
import { subscribeMotorUsage } from './telemetry-service'

/** Doble del puente: fuera de Electron no existe `window.api`. */
function stubPuente(): { avisar: (id: string) => void; lecturas: () => number } {
  let listener: ((id: string) => void) | null = null
  let lecturas = 0
  const onChanged = (l: (id: string) => void): (() => void) => {
    listener = l
    return () => (listener = null) as unknown as void
  }
  const session = (): Promise<unknown> =>
    Promise.resolve({ ...EMPTY_USAGE, outputTokens: ++lecturas * 1000 })
  const sinFactura = (): Promise<unknown> => Promise.resolve(NADA_SIN_MEDIR)
  // prettier-ignore
  Object.assign(globalThis, { window: { api: { repair: { onChanged }, telemetry: { session, sinFactura } } } })
  return { avisar: (id) => listener?.(id), lecturas: () => lecturas }
}

beforeEach(() => {
  useTelemetryStore.setState({ session: EMPTY_USAGE, sinMedir: NADA_SIN_MEDIR })
})

describe('el pie cuenta tambien el trabajo del motor', () => {
  it('cada aviso del motor relee el gasto: sube mientras drena, no al final', async () => {
    // El asiento se manda en CADA evento del expediente, y el AGENT_RUN se
    // escribe justo tras cada corrida. Tres corridas, tres lecturas.
    const puente = stubPuente()
    subscribeMotorUsage()

    puente.avisar('proj')
    puente.avisar('proj')
    puente.avisar('proj')
    await Promise.resolve()

    expect(puente.lecturas()).toBe(3)
  })

  it('la cifra del pie acaba reflejando lo leido', async () => {
    const puente = stubPuente()
    subscribeMotorUsage()

    puente.avisar('proj')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(useTelemetryStore.getState().session.outputTokens).toBe(1000)
  })

  it('no filtra por proyecto: el total de la sesion tampoco lo esta', async () => {
    const puente = stubPuente()
    subscribeMotorUsage()

    puente.avisar('otro-proyecto')
    await Promise.resolve()

    expect(puente.lecturas()).toBe(1)
  })

  it('desuscribirse corta el goteo', async () => {
    const puente = stubPuente()
    subscribeMotorUsage()()

    puente.avisar('proj')
    await Promise.resolve()

    expect(puente.lecturas()).toBe(0)
  })
})
