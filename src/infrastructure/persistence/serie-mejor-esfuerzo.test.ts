import { beforeEach, describe, expect, it } from 'vitest'
import { recorrerParadas } from '@application/scan/recorrer-paradas'
import { SIN_SALIDAS } from '@application/scan/progreso-del-recorrido'
import type { AppContext } from '@application/context'
import { crearBench } from './banco-del-recorrido'
import { PROJECT, PROYECTO, type Bench } from './cierre-partido-fixture'
import { CUATRO } from './recorrido-fixture'
import { scannerFalso } from './scanner-falso'

let bench: Bench

beforeEach(() => {
  bench = crearBench()
})

/**
 * La telemetria por parada es mejor esfuerzo, molde `recordChatRun`: perder una
 * fila es molesto; perder la parada que el operador acaba de pagar, no.
 */
describe('perder la telemetria de una parada no cuesta el escaneo', () => {
  it('si el repositorio revienta, el recorrido termina y guarda sus hallazgos', async () => {
    const conDiscoLleno = {
      ...bench.context,
      paradaRuns: {
        record: () => {
          throw new Error('disco lleno')
        },
        listByScan: () => []
      }
    } as unknown as AppContext

    await recorrerParadas(conDiscoLleno, scannerFalso(), PROJECT, CUATRO, SIN_SALIDAS, {
      cancelado: () => false
    })

    expect(bench.context.scans.listByProject(PROYECTO, 10)[0].estado).toBe('CERRADO')
    expect(bench.cuantas('findings')).toBeGreaterThan(0)
  })
})
