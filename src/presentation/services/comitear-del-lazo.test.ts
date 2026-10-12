import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLazoStore } from '../stores/lazo-store'
import { comitearDelLazo } from './comitear-del-lazo'
import { api } from '../adapters/fortress-api'

vi.mock('../adapters/fortress-api', () => ({ api: vi.fn() }))

const spyCommit = vi.fn().mockResolvedValue('commiteado')

beforeEach(() => {
  useLazoStore.getState().parar()
  vi.mocked(api).mockReturnValue({ repair: { lazoCommit: spyCommit } } as unknown as ReturnType<typeof api>) // prettier-ignore
  spyCommit.mockClear()
})

afterEach(() => useLazoStore.getState().parar())

describe('comitearDelLazo: commit durable de la cabeza en la vuelta (ATERRIZAJE-4)', () => {
  it('con cabeza -> pide lazoCommit(projectId, cabeza)', async () => {
    useLazoStore.getState().congelarCola(['Y'])
    await comitearDelLazo('p1')
    expect(spyCommit).toHaveBeenCalledWith('p1', 'Y')
  })

  it('sin cabeza (cola null) -> NO commitea', async () => {
    await comitearDelLazo('p1')
    expect(spyCommit).not.toHaveBeenCalled()
  })
})
