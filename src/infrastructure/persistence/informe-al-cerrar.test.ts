import { beforeEach, describe, expect, it } from 'vitest'
import { paradasDeTema } from '@domain/scan/modulos-de-tema'
import type { ModulosDelCierre } from '@domain/scan/modulos-del-cierre'
import { aModulosDelCierre } from '@domain/scan/modulos-del-cierre'
import { correrRecorrido, crearBench } from './banco-del-recorrido'
import { CUATRO } from './recorrido-fixture'
import type { Bench } from './cierre-partido-fixture'

const CAMPANA: Omit<ModulosDelCierre, 'temasCorridos'> = {
  aplicables: ['M2', 'M9'],
  descartados: [{ modulo: 'M8', razon: 'M8: no aplica, src/a.ts:1' }],
  sinConstancia: [],
  plantillasAusentes: ['M9']
}

let bench: Bench

beforeEach(() => {
  bench = crearBench()
})

describe('la campaña queda PERSISTIDA, no se recalcula', () => {
  it('la fila guarda el veredicto entero, los temas corridos y las ausentes', async () => {
    const { fila } = await correrRecorrido(bench, {
      ...CUATRO,
      ...{ modulosAplicables: CAMPANA.aplicables, modulosDescartados: CAMPANA.descartados },
      plantillasAusentes: CAMPANA.plantillasAusentes,
      paradas: [...CUATRO.paradas, ...paradasDeTema(['M2'])]
    })

    const guardado = aModulosDelCierre(fila().modulos ?? null)

    expect(guardado.aplicables).toEqual(['M2', 'M9'])
    expect(guardado.descartados[0].razon).toContain('src/a.ts:1')
    expect(guardado.temasCorridos).toEqual(['M2'])
    expect(guardado.plantillasAusentes).toEqual(['M9'])
  })

  it('un tema que APLICABA y no llego a correr no cuenta como corrido', async () => {
    const { fila } = await correrRecorrido(
      bench,
      {
        ...CUATRO,
        modulosAplicables: ['M2'],
        paradas: [...CUATRO.paradas, ...paradasDeTema(['M2'])]
      },
      (rotulo) => rotulo === 'web'
    )

    const guardado = aModulosDelCierre(fila().modulos ?? null)

    expect(guardado.aplicables).toEqual(['M2'])
    expect(guardado.temasCorridos).toEqual([])
  })
})
