import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cerrarEscaneo } from '@application/scan/cerrar-escaneo'
import type { DatosDelInforme } from '@domain/scan/informe-datos'
import { SIN_CAMPANA } from '@domain/scan/modulos-del-cierre'
import { crearBench } from './banco-del-recorrido'
import type { Bench } from './cierre-partido-fixture'

const CAMPANA = SIN_CAMPANA

let bench: Bench

beforeEach(() => {
  bench = crearBench()
})

describe('perder el informe no cuesta la auditoria', () => {
  it('un escritor que revienta deja la fila y los hallazgos intactos', () => {
    const roto = vi.fn((): DatosDelInforme => {
      throw new Error('disco lleno')
    })
    const context = { ...bench.context, informeWriter: { write: roto } }

    expect(() =>
      cerrarEscaneo(context, { id: 'p1', name: 'P', path: '/tmp/p' } as never, {
        scanId: bench.context.scans.abrir({ projectId: 'p1', startedAt: 'x', paradasTotal: 1, ficherosTotal: null }).id, // prettier-ignore
        reportados: [],
        paradasHechas: 1,
        paradasTotal: 1,
        ficherosCubiertos: null,
        ficherosTotal: null,
        modulos: { ...CAMPANA, temasCorridos: [] },
        motivo: 'completo',
        at: '2026-09-10T00:00:00.000Z',
        durationMs: 1,
        usage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0, costUsd: 0, numTurns: 0 }, // prettier-ignore
        tools: [],
        edits: []
      })
    ).not.toThrow()
    expect(roto).toHaveBeenCalledTimes(1)
  })
})
