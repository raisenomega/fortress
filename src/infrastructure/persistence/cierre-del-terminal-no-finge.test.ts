import { beforeEach, describe, expect, it } from 'vitest'
import { createBench, PROJECT, SSRF, type Bench } from './finding-fixture'

const NOTA = 'arreglado por el Terminal · turno m-1 · ficheros: src/api.ts'
const PENDIENTE = 'pendiente de verificar: el cierre del Terminal no llego a un dictamen (boom)'

let bench: Bench

const fila = (id: string): unknown =>
  bench.db
    .prepare(
      `SELECT lifecycle, mitigated_note AS nota, verificacion_note AS dictamen
       FROM findings WHERE id = ?`
    )
    .get(id)

beforeEach(() => {
  bench = createBench()
})

describe('un cierre del Terminal sin dictamen no finge, sobre SQLite real (ADR-088)', () => {
  it('pendiente: sigue MITIGATED, la nota del Terminal intacta, y fuera de Historia', () => {
    bench.repo.syncFromScan(PROJECT, 's1', [SSRF], '2026-08-08T10:00:00Z', new Set())
    const id = bench.memoryOf(SSRF.title)?.id ?? ''
    bench.repo.markMitigated(id, NOTA, '2026-09-15T10:00:00Z')

    expect(bench.repo.anotarVerificacion(id, PENDIENTE)).toBe(true)

    expect(fila(id)).toEqual({ lifecycle: 'MITIGATED', nota: NOTA, dictamen: PENDIENTE })
    expect(bench.repo.listHistoria(PROJECT)).toHaveLength(0)
  })
})
