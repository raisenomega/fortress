import { beforeEach, describe, expect, it } from 'vitest'
import type { Manifiesto } from '@domain/scan/manifiesto'
import { paradasDeTema } from '@domain/scan/modulos-de-tema'
import { correrRecorrido, crearBench } from './banco-del-recorrido'
import type { Bench } from './cierre-partido-fixture'
import { CUATRO } from './recorrido-fixture'
import type { FacturaDeParada } from './scanner-falso'

/** Cada parada cuesta distinto: si todas costaran igual, la serie y la suma
 *  dividida entre cuatro serian indistinguibles. */
const DISTINTA: FacturaDeParada = (_carpeta, i) => ({
  durationMs: i * 1000,
  usage: {
    inputTokens: i,
    outputTokens: i * 10,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    costUsd: i * 0.5,
    numTurns: i * 7
  }
})

let bench: Bench

beforeEach(() => {
  bench = crearBench()
})

describe('una fila por parada, con SU dato y no con la suma', () => {
  it('cuatro paradas dan cuatro filas, en el orden del recorrido', async () => {
    const { serie } = await correrRecorrido(bench, CUATRO, undefined, DISTINTA)

    expect(serie()).toHaveLength(4)
    expect(serie().map((r) => r.paradaIndice)).toEqual([1, 2, 3, 4])
    // El orden del RECORRIDO: lo sensible delante (auth, payment), no el del manifiesto.
    expect(serie().map((r) => r.paradaRotulo)).toEqual(['auth', 'payment', 'web', 'utils'])
  })

  it('cada fila trae LO SUYO: ni la suma, ni la media', async () => {
    const { serie } = await correrRecorrido(bench, CUATRO, undefined, DISTINTA)

    expect(serie().map((r) => r.durationMs)).toEqual([1000, 2000, 3000, 4000])
    expect(serie().map((r) => r.usage.numTurns)).toEqual([7, 14, 21, 28])
    expect(serie().map((r) => r.usage.costUsd)).toEqual([0.5, 1, 1.5, 2])
  })

  it('un tema tambien deja su fila, con su rotulo', async () => {
    const conTema: Manifiesto = {
      ...CUATRO,
      modulosAplicables: ['M2'],
      paradas: [...CUATRO.paradas, ...paradasDeTema(['M2'])]
    }

    const { serie } = await correrRecorrido(bench, conTema, undefined, DISTINTA)

    expect(serie()).toHaveLength(5)
    expect(serie()[4].paradaRotulo).toBe('M2 DR/BCP — todo el proyecto')
  })
})
