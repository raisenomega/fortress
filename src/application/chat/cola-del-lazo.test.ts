import { describe, expect, it, vi } from 'vitest'
import { colaDelLazo } from './cola-del-lazo'
import { candidates } from '../repair/elegir-objetivo'

vi.mock('../repair/elegir-objetivo', () => ({ candidates: vi.fn(() => []) }))
vi.mock('@domain/repair/orden-de-la-cola', () => ({ ordenarCola: vi.fn(() => ['crit', 'high']) }))

type Ctx = Parameters<typeof colaDelLazo>[0]
const ctx = (project: unknown, sha: string | null): Ctx =>
  ({ projects: { findById: () => project }, headSha: () => sha }) as unknown as Ctx

describe('colaDelLazo: orquesta la cola congelable (ATERRIZAJE-1)', () => {
  it('proyecto inexistente -> []', () => {
    expect(colaDelLazo(ctx(null, 'sha'), 'p1')).toEqual([])
  })

  it('sin HEAD -> [] (sin descuentos anclados, como el cerco)', () => {
    expect(colaDelLazo(ctx({ path: '/p' }, null), 'p1')).toEqual([])
  })

  it('con proyecto y HEAD -> ordenarCola(candidates(...)) con modo hasta-omega', () => {
    expect(colaDelLazo(ctx({ path: '/p' }, 'sha1'), 'p1')).toEqual(['crit', 'high'])
    expect(candidates).toHaveBeenCalledWith(expect.anything(), 'p1', 'sha1', '/p', 'hasta-omega')
  })
})
