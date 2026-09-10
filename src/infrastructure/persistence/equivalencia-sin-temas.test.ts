import { beforeEach, describe, expect, it } from 'vitest'
import type { Manifiesto } from '@domain/scan/manifiesto'
import { correrRecorrido, crearBench } from './banco-del-recorrido'
import type { Bench } from './cierre-partido-fixture'
import { CUATRO } from './recorrido-fixture'

/** Las cuatro carpetas de siempre, sin un solo modulo de tema aplicable. */
const SIN_TEMAS: Manifiesto = { ...CUATRO, modulosAplicables: ['M9'] }

let bench: Bench

beforeEach(() => {
  bench = crearBench()
})

describe('sin temas aplicables, el recorrido es el de la Fase 2', () => {
  it('las mismas cuatro paradas, todas con rutas', async () => {
    const { scanner, fila } = await correrRecorrido(bench, SIN_TEMAS)

    expect(scanner.pedidas).toEqual(['auth', 'payment', 'web', 'utils'])
    expect(scanner.peticiones.every((p) => p.rutas !== undefined)).toBe(true)
    expect(fila().paradasHechas).toBe(4)
    expect(fila().ficherosCubiertos).toBe(6)
  })
})
