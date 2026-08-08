import { beforeEach, describe, expect, it } from 'vitest'
import { API_KEY, createBench, PROJECT, SSRF, type Bench } from './finding-fixture'

let bench: Bench

beforeEach(() => {
  bench = createBench()
})

describe('memoria de hallazgos: la historia se preserva', () => {
  it('firstSeen NO se reescribe y lastSeen avanza', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z')
    bench.repo.syncFromScan(PROJECT, 's2', [SSRF], '2026-08-11T10:00:00Z')

    expect(bench.memoryOf(SSRF.title)?.firstSeen).toBe('2026-08-08T10:00:00Z')
    expect(bench.memoryOf(SSRF.title)?.lastSeen).toBe('2026-08-11T10:00:00Z')
  })

  it('el codigo se mueve de linea y sigue siendo la MISMA fila', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z')
    const antes = bench.memoryOf(SSRF.title)?.id

    bench.repo.syncFromScan(PROJECT, 's2', [{ ...SSRF, line: 41 }], '2026-08-09T10:00:00Z')

    expect(bench.rows()).toBe(1)
    expect(bench.memoryOf(SSRF.title)?.id).toBe(antes)
    expect(bench.memoryOf(SSRF.title)?.line).toBe(41) // se refresca la posicion nueva
  })

  it('un hallazgo nuevo de verdad entra con su propia fecha, sin heredar la ajena', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z')
    bench.repo.syncFromScan(PROJECT, 's2', [SSRF, API_KEY], '2026-08-09T10:00:00Z')

    expect(bench.rows()).toBe(2)
    expect(bench.memoryOf(API_KEY.title)?.firstSeen).toBe('2026-08-09T10:00:00Z')
    expect(bench.memoryOf(SSRF.title)?.firstSeen).toBe('2026-08-08T10:00:00Z')
  })

  it('todo hallazgo nace ACTIVE y con su clave estable puesta', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z')
    const memoria = bench.memoryOf(SSRF.title)

    expect(memoria?.lifecycle).toBe('ACTIVE')
    expect(memoria?.resolvedAt).toBeNull()
    expect(memoria?.identity).toContain('target-url.ts')
  })

  it('el descarte del operador es ORTOGONAL al ciclo de vida del problema', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z')
    const id = bench.memoryOf(SSRF.title)?.id ?? ''

    expect(bench.repo.dismiss(id)).toBe(true)

    const memoria = bench.memoryOf(SSRF.title)
    expect(memoria?.status).toBe('false_positive') // decision del operador
    expect(memoria?.lifecycle).toBe('ACTIVE') // el problema sigue en el codigo
  })
})
