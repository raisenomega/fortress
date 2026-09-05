import { describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import { buildGenesisRuntime } from './genesis-deps'

vi.mock('./genesis-registry', () => ({
  isGenesisCancelled: () => false,
  waitOrCancel: () => Promise.resolve(),
  sendGenesisStatus: () => {}
}))

/** Contexto con el gasto de HOY que se le diga. Sale de `runs`, que esta
 *  persistido: es justo lo que un reinicio del bucle NO borra. */
const ctx = (gastadoHoy: number, tope: string | null): AppContext =>
  ({
    settings: { get: (k: string) => (k.includes('Day') ? tope : null) },
    runs: {
      usageSince: () => ({ costUsd: gastadoHoy }),
      sinFacturaSince: () => ({ runs: 0 })
    }
  }) as unknown as AppContext

const BUDGET = { costCapUsd: 5, maxEpisodes: 20 }
const runtime = (gastado: number, tope: string | null): ReturnType<typeof buildGenesisRuntime> =>
  buildGenesisRuntime(ctx(gastado, tope), BUDGET, 1)

describe('genesis consulta el tope del DIA, no solo el de su sesion', () => {
  it('con el dia gastado lo dice, aunque acabe de arrancar', () => {
    expect(runtime(999, '1').deps.topeDiario()).toBe(true)
  })

  it('con saldo del dia, no', () => {
    expect(runtime(0, '100').deps.topeDiario()).toBe(false)
  })

  it('sale de `runs` y no de un contador de la sesion: spentSession nace en cero', () => {
    // Los dos a la vez son el bug: la sesion en cero y el dia agotado.
    const r = runtime(999, '1')

    expect(r.deps.spentSession()).toBe(0)
    expect(r.deps.topeDiario()).toBe(true)
  })
})
