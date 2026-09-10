import { beforeEach, describe, expect, it } from 'vitest'
import type { Manifiesto } from '@domain/scan/manifiesto'
import { paradasDeTema } from '@domain/scan/modulos-de-tema'
import { correrRecorrido, crearBench } from './banco-del-recorrido'
import type { Bench } from './cierre-partido-fixture'
import { CUATRO } from './recorrido-fixture'

const CON_TEMAS: Manifiesto = {
  ...CUATRO,
  modulosAplicables: ['M2', 'M9'],
  paradas: [...CUATRO.paradas, ...paradasDeTema(['M2'])]
}

let bench: Bench

beforeEach(() => {
  bench = crearBench()
})

describe('una parada de tema mira el proyecto entero', () => {
  it('su peticion va SIN rutas, y lleva solo su modulo', async () => {
    const { scanner } = await correrRecorrido(bench, CON_TEMAS)
    const delTema = scanner.peticiones[scanner.peticiones.length - 1]

    expect(delTema.rutas).toBeUndefined()
    expect(delTema.modulos).toEqual(['M2'])
  })

  it('las de carpeta siguen acotadas, y llevan los modulos de carpeta', async () => {
    const { scanner } = await correrRecorrido(bench, CON_TEMAS)

    expect(scanner.peticiones[0].rutas).toEqual(['auth'])
    expect(scanner.peticiones[0].modulos).toEqual(['M9'])
  })

  it('y el tema va el ULTIMO: si paras antes, no arranca', async () => {
    // Detener durante 'web': la que corre termina —el boton solo impide la
    // SIGUIENTE—, asi que quedan fuera 'utils' Y el tema, que iba detras.
    const { scanner, fila } = await correrRecorrido(bench, CON_TEMAS, (r) => r === 'web')

    expect(scanner.pedidas).toEqual(['auth', 'payment', 'web'])
    expect(scanner.peticiones.every((p) => p.rutas !== undefined)).toBe(true)
    expect(fila().paradasHechas).toBe(3)
    expect(fila().estado).toBe('ABORTADO')
  })
})
