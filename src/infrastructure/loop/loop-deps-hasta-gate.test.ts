import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import * as motor from '@application/repair/run-motor-chain'
import { buildDeps, type EngineParams } from './loop-deps-factory'

vi.mock('../repair/motor-chain-deps', () => ({ buildMotorChainDeps: () => ({}) }))
// El registro vive en el proceso de Electron: aqui solo hace falta que la
// vuelta no se cancele sola por no encontrar su handle.
vi.mock('./loop-registry', () => ({
  isLoopCancelled: () => false,
  sendLoopChunk: () => {},
  sendLoopStatus: () => {},
  waitOrCancel: () => Promise.resolve()
}))

const CONFIG = { projectId: 'p1', costCap: 10, maxCycles: 3 }

/** Lo minimo para pasar el freno: proyecto limpio, tope sin tocar. Desde que
 *  `fix` toma `guardRun`, un contexto vacio ya no llega al motor. */
const LIMPIO = {
  projects: { findById: () => ({ id: 'p1', contaminated: false }) },
  settings: { get: () => null },
  runs: { usageSince: () => ({ costUsd: 0 }), sinFacturaSince: () => ({ runs: 0 }) }
} as unknown as AppContext

const params = (hastaGate: boolean): EngineParams => ({
  context: LIMPIO,
  config: CONFIG,
  baseline: 0,
  hastaGate,
  onStandby: () => {},
  persist: () => {}
})

afterEach(() => vi.restoreAllMocks())

/** Con que MODO llamo el loop al motor en esa vuelta. */
async function banderaDeLaVuelta(hastaGate: boolean): Promise<unknown> {
  const espia = vi.spyOn(motor, 'runMotorChain').mockResolvedValue({ ok: true, value: { kind: 'sin-candidato' } }) // prettier-ignore
  await buildDeps(params(hastaGate)).fix()
  return espia.mock.calls[0]?.[3]
}

describe('la bandera hasta-gate llega hasta el motor, no se queda en el gate', () => {
  it('el repo propio corre en hasta-gate: nunca integra sin firma', async () => {
    // El gate del loop lo permite POR estar en este modo. Si el modo se
    // perdiera por el camino, el permiso quedaria concedido y la garantia no.
    expect(await banderaDeLaVuelta(true)).toBe('hasta-gate')
  })

  it('cualquier otro proyecto corre la vuelta entera, como hasta hoy', async () => {
    expect(await banderaDeLaVuelta(false)).toBe('completo')
  })
})
