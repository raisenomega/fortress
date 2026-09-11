import { beforeEach, describe, expect, it } from 'vitest'
import { recorrerParadas } from '@application/scan/recorrer-paradas'
import { SIN_SALIDAS } from '@application/scan/progreso-del-recorrido'
import { asentarIntentoFallido } from '@application/scan/asentar-intento-fallido'
import type { Scanner } from '@domain/scan/scanner'
import { err } from '@domain/shared/result'
import { crearBench } from './banco-del-recorrido'
import { PROJECT, PROYECTO, SIN_FACTURA, type Bench } from './cierre-partido-fixture'
import { CUATRO } from './recorrido-fixture'
import { scannerFalso } from './scanner-falso'

/** Revienta en la TERCERA pasada, como cuando el proceso muere a mitad. */
function rotoEnLaTercera(): Scanner {
  const base = scannerFalso()
  let n = 0
  return {
    isAvailable: base.isAvailable,
    precheck: base.precheck,
    scan: (request, onProgress) => {
      n += 1
      return n === 3 ? Promise.resolve(err('el escaner reventó')) : base.scan(request, onProgress)
    }
  }
}

let bench: Bench

beforeEach(() => {
  bench = crearBench()
})

const serie = (): number =>
  bench.context.paradaRuns.listByScan(bench.context.scans.listByProject(PROYECTO, 10)[0].id).length

const corridas = (): number =>
  (bench.db.prepare('SELECT COUNT(*) n FROM agent_runs').get() as { n: number }).n

describe('un fallo a mitad no deja la serie a medias ni duplica el gasto', () => {
  it('las paradas terminadas dejan su fila; la que reventó, ninguna', async () => {
    // La factura real del intento, como la asienta `claude-scanner`.
    asentarIntentoFallido(bench.context, {
      projectId: PROYECTO,
      motivo: 'proceso',
      durationMs: 901_727,
      usage: SIN_FACTURA,
      tools: [],
      texto: 'murio'
    })

    await recorrerParadas(bench.context, rotoEnLaTercera(), PROJECT, CUATRO, SIN_SALIDAS, {
      cancelado: () => false
    })

    expect(serie()).toBe(2)
    // UNA sola corrida: la del intento. `yaHayFactura` impidio la del cierre, y
    // la serie vive en otra tabla — duplicar el gasto es imposible por forma.
    expect(corridas()).toBe(1)
  })
})
