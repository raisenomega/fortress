import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLazoStore } from '../stores/lazo-store'
import { avanzarCola } from './avanzar-cola'
import { api } from '../adapters/fortress-api'

vi.mock('../adapters/fortress-api', () => ({ api: vi.fn() }))

const conExtinto = (v: boolean | Error): void => {
  const fn = v instanceof Error ? vi.fn().mockRejectedValue(v) : vi.fn().mockResolvedValue(v)
  vi.mocked(api).mockReturnValue({ repair: { lazoExtinto: fn } } as unknown as ReturnType<typeof api>) // prettier-ignore
}

beforeEach(() => {
  useLazoStore.getState().parar()
  useLazoStore.getState().congelarCola(['A', 'B', 'C'])
})

afterEach(() => useLazoStore.getState().parar())

describe('avanzarCola: pop SOLO por extincion real (ATERRIZAJE-5)', () => {
  it('CLAVE: extinguio (EXTINCT) -> pop, la cabeza avanza', async () => {
    conExtinto(true)
    await avanzarCola('p1', 'A')
    expect(useLazoStore.getState().cola).toEqual(['B', 'C']) // A fuera
  })

  it('MUTANTE: NO extinguio -> NO pop (se re-intenta)', async () => {
    conExtinto(false)
    await avanzarCola('p1', 'A')
    expect(useLazoStore.getState().cola).toEqual(['A', 'B', 'C']) // intacta
  })

  it('IPC falla -> NO pop (conservador, no pierde el hallazgo)', async () => {
    conExtinto(new Error('mcp caido'))
    await avanzarCola('p1', 'A')
    expect(useLazoStore.getState().cola).toEqual(['A', 'B', 'C'])
  })
})
