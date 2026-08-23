import { beforeEach, describe, expect, it } from 'vitest'
import { createBench, PROJECT, SSRF, API_KEY, type Bench } from './finding-fixture'

let bench: Bench

beforeEach(() => {
  bench = createBench()
})

describe('markExtinct (la transicion, ya con la evidencia reunida)', () => {
  it('cierra el ciclo de vida con fecha, sin borrar la fila', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF, API_KEY], '2026-08-08T10:00:00Z', new Set())
    const id = bench.memoryOf(SSRF.title)?.id ?? ''

    bench.repo.markExtinct([id], '2026-08-09T10:00:00Z', 'juicio_obsoleto')

    const memoria = bench.memoryOf(SSRF.title)
    expect(memoria?.lifecycle).toBe('EXTINCT')
    expect(memoria?.resolvedAt).toBe('2026-08-09T10:00:00Z')
    expect(bench.rows()).toBe(2) // sigue ahi: extinguir no es borrar
  })

  it('un extinto deja de contar para el tablero', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF, API_KEY], '2026-08-08T10:00:00Z', new Set())
    bench.repo.markExtinct(
      [bench.memoryOf(SSRF.title)?.id ?? ''],
      '2026-08-09T10:00:00Z',
      'juicio_obsoleto'
    )

    expect(bench.repo.countsByProject()[PROJECT]).toMatchObject({ MEDIUM: 0, LOW: 1 })
  })

  it('si el problema REAPARECE, el hallazgo vuelve a la vida', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z', new Set())
    const id = bench.memoryOf(SSRF.title)?.id ?? ''
    bench.repo.markExtinct([id], '2026-08-09T10:00:00Z', 'juicio_obsoleto')

    bench.repo.syncFromScan(PROJECT, 's2', [SSRF], '2026-08-10T10:00:00Z', new Set())

    const memoria = bench.memoryOf(SSRF.title)
    expect(memoria?.lifecycle).toBe('ACTIVE') // se volvio a ver: no estaba resuelto
    expect(memoria?.resolvedAt).toBeNull()
    expect(memoria?.id).toBe(id) // la misma fila de siempre
    expect(memoria?.firstSeen).toBe('2026-08-08T10:00:00Z')
  })
})
