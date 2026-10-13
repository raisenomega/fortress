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

    bench.repo.markExtinct([id], '2026-08-09T10:00:00Z', 'juicio_obsoleto', 'agente')

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
      'juicio_obsoleto',
      'agente'
    )

    expect(bench.repo.countsByProject()[PROJECT]).toMatchObject({ MEDIUM: 0, LOW: 1 })
  })

  it('si el problema REAPARECE, el hallazgo vuelve a la vida', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z', new Set())
    const id = bench.memoryOf(SSRF.title)?.id ?? ''
    bench.repo.markExtinct([id], '2026-08-09T10:00:00Z', 'juicio_obsoleto', 'agente')

    bench.repo.syncFromScan(PROJECT, 's2', [SSRF], '2026-08-10T10:00:00Z', new Set())

    const memoria = bench.memoryOf(SSRF.title)
    expect(memoria?.lifecycle).toBe('ACTIVE') // se volvio a ver: no estaba resuelto
    expect(memoria?.resolvedAt).toBeNull()
    expect(memoria?.id).toBe(id) // la misma fila de siempre
    expect(memoria?.firstSeen).toBe('2026-08-08T10:00:00Z')
  })
})

const notas = (id: string): { v: string | null; m: string | null; a: string | null; e: string | null } =>
  bench.db.prepare('SELECT verificacion_note v, mitigated_note m, mitigated_at a, extinct_reason e FROM findings WHERE id = ?').get(id) as never // prettier-ignore

describe('INC-D: el Libro no muestra un motivo que contradiga el lifecycle', () => {
  it('al extinguir BORRA las notas de la fase mitigada', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z', new Set())
    const id = bench.memoryOf(SSRF.title)?.id ?? ''
    bench.repo.markMitigated(id, 'arreglado; SIN VERIFICAR', '2026-08-08T11:00:00Z')
    bench.repo.anotarVerificacion(id, 'el analista no pudo probarlo, NO se cierra')
    bench.repo.markExtinct([id], '2026-08-09T10:00:00Z', 'juicio_obsoleto', 'agente')

    const n = notas(id)
    expect(n.v).toBeNull() // ya NO arrastra la vieja "no se cierra"
    expect(n.m).toBeNull()
    expect(n.a).toBeNull()
    expect(n.e).toBe('juicio_obsoleto') // el motivo verdadero manda
  })

  it('un mitigado que SIGUE mitigado conserva su nota (no regresion)', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z', new Set())
    const id = bench.memoryOf(SSRF.title)?.id ?? ''
    bench.repo.markMitigated(id, 'arreglado por el operador', '2026-08-08T11:00:00Z')

    expect(notas(id).m).toBe('arreglado por el operador')
  })
})
