import { beforeEach, describe, expect, it } from 'vitest'
import type { Manifiesto } from '@domain/scan/manifiesto'
import { paradasDeTema } from '@domain/scan/modulos-de-tema'
import { correrRecorrido, crearBench } from './banco-del-recorrido'
import type { Bench } from './cierre-partido-fixture'
import { CUATRO } from './recorrido-fixture'

/** Las cuatro carpetas de siempre (6 ficheros) MAS tres pasadas de tema. */
const CON_TEMAS: Manifiesto = {
  ...CUATRO,
  modulosAplicables: ['M2', 'M7', 'M12'],
  paradas: [...CUATRO.paradas, ...paradasDeTema(['M2', 'M7', 'M12'])]
}

let bench: Bench

beforeEach(() => {
  bench = crearBench()
})

describe('los temas suman paradas, nunca ficheros', () => {
  it('4 carpetas + 3 temas = 7 paradas, y siguen siendo 6 de 6 ficheros', async () => {
    const { fila } = await correrRecorrido(bench, CON_TEMAS)

    expect(fila().paradasHechas).toBe(7)
    expect(fila().paradasTotal).toBe(7)
    // Los tres temas suman CERO ficheros. Sumarles el total daria 24 de 6, que
    // es la mentira hacia arriba que ADR-082 prohibe.
    expect(fila().ficherosCubiertos).toBe(6)
    expect(fila().ficherosTotal).toBe(6)
  })

  it('la cobertura jamas pasa del cien por cien', async () => {
    const { fila } = await correrRecorrido(bench, CON_TEMAS)

    expect(fila().ficherosCubiertos).toBeLessThanOrEqual(fila().ficherosTotal ?? 0)
  })
})
