import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLazoStore } from '../stores/lazo-store'
import { cargarColaDelLazo } from './cargar-cola-del-lazo'
import { api } from '../adapters/fortress-api'

vi.mock('../adapters/fortress-api', () => ({ api: vi.fn() }))

const conCola = (cola: () => Promise<readonly string[]>): void => {
  vi.mocked(api).mockReturnValue({ repair: { cola } } as unknown as ReturnType<typeof api>)
}

beforeEach(() => useLazoStore.getState().parar())
afterEach(() => useLazoStore.getState().parar())

describe('cargarColaDelLazo: congela la cola al arrancar (ATERRIZAJE-1)', () => {
  it('lee el IPC repair:cola y congela los ids', async () => {
    conCola(() => Promise.resolve(['crit', 'high']))
    await cargarColaDelLazo('p1')
    expect(useLazoStore.getState().cola).toEqual(['crit', 'high'])
  })

  it('si el IPC falla -> cola vacia (nada que hacer, no revienta)', async () => {
    conCola(() => Promise.reject(new Error('mcp caido')))
    await cargarColaDelLazo('p1')
    expect(useLazoStore.getState().cola).toEqual([])
  })
})
