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

const params = (hastaGate: boolean): EngineParams => ({
  context: {} as AppContext,
  config: CONFIG,
  baseline: 0,
  hastaGate,
  onStandby: () => {},
  persist: () => {}
})

afterEach(() => vi.restoreAllMocks())

/** Con que bandera llamo el loop al motor en esa vuelta. */
async function banderaDeLaVuelta(hastaGate: boolean): Promise<unknown> {
  const espia = vi.spyOn(motor, 'runMotorChain').mockResolvedValue({ ok: true, value: { kind: 'sin-candidato' } }) // prettier-ignore
  await buildDeps(params(hastaGate)).fix()
  return espia.mock.calls[0]?.[3]
}

describe('la bandera hasta-gate llega hasta el motor, no se queda en el gate', () => {
  it('el repo propio corre con stopAtGate: nunca integra sin firma', async () => {
    // El gate del loop lo permite POR estar en este modo. Si la bandera se
    // perdiera por el camino, el permiso quedaria concedido y la garantia no.
    expect(await banderaDeLaVuelta(true)).toBe(true)
  })

  it('cualquier otro proyecto corre la vuelta entera, como hasta hoy', async () => {
    expect(await banderaDeLaVuelta(false)).toBe(false)
  })
})
