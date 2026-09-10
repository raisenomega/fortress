import { beforeEach, describe, expect, it } from 'vitest'
import { SCORE_PROVISIONAL } from '@domain/scan/scan-history-repository'
import { APERTURA, crearBench, PROYECTO, type Bench } from './scan-history-fixture'

let bench: Bench

beforeEach(() => {
  bench = crearBench()
})

describe('abrir', () => {
  it('deja la fila ABIERTA, con score provisional y lo que hay por delante', () => {
    const abierto = bench.repo.abrir(APERTURA)

    expect(abierto.estado).toBe('ABIERTO')
    expect(abierto.score).toBe(SCORE_PROVISIONAL)
    expect(abierto.startedAt).toBe(APERTURA.startedAt)
    expect(abierto.paradasTotal).toBe(12)
    expect(abierto.ficherosTotal).toBe(2108)
  })

  it('nada del cierre consta todavia, y no se finge con ceros', () => {
    const abierto = bench.repo.abrir(APERTURA)

    expect(abierto.paradasHechas).toBeNull()
    expect(abierto.ficherosCubiertos).toBeNull()
    expect(abierto.motivoCierre).toBeNull()
  })

  it('lo que devuelve es lo que quedo en la base', () => {
    const devuelto = bench.repo.abrir(APERTURA)

    expect(bench.releer()).toEqual(devuelto)
  })
})

describe('record, el escaneo de una pieza, no cambia', () => {
  it('nace ya CERRADO y sin recorrido que contar', () => {
    bench.repo.record({
      projectId: PROYECTO,
      score: 64,
      findingCount: 3,
      dossierCount: 3,
      criticalCount: 0,
      durationMs: 1000,
      at: '2026-09-09T22:00:00Z'
    })

    const fila = bench.releer()
    expect(fila.estado).toBe('CERRADO')
    expect(fila.score).toBe(64)
    expect(fila.paradasTotal).toBeNull()
    expect(fila.startedAt).toBeNull()
  })
})
