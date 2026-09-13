import { afterEach, describe, expect, it, vi } from 'vitest'
import { verificadosDe } from '@domain/repair/verificacion-masiva'
import { verificarTodos } from './verificar-todos'
import { banco, deps, mitigado, verificador } from './verificar-todos-fixture'

afterEach(() => vi.restoreAllMocks())

const SEIS = ['f0', 'f1', 'f2', 'f3', 'f4', 'f5'].map(mitigado)

describe('el parte reparte por desenlace, sin colapsar ninguno', () => {
  it('3 extinguidos + 2 siguen vivos + 1 sin prueba: dice exactamente eso', async () => {
    verificador('extinguido', 'extinguido', 'extinguido', 'sigue_vivo', 'sigue_vivo', 'sin_prueba')

    const parte = await verificarTodos(banco(SEIS), 'p1', deps())

    expect(parte).toMatchObject({
      fin: 'completado',
      total: 6,
      extinguidos: 3,
      siguenVivos: 2,
      sinPrueba: 1,
      omitidos: 0,
      sinClasificar: 0
    })
  })

  it('sin prueba y sigue vivo NO se funden: son casillas distintas y se ven', async () => {
    // Colapsarlos en un «no se extinguio» le quitaria al operador justo el dato
    // que le dice si su fix sirvio: uno es «no se pudo comprobar» y el otro es
    // «el problema esta ahi».
    verificador('sin_prueba', 'sigue_vivo')

    const parte = await verificarTodos(banco(SEIS.slice(0, 2)), 'p1', deps())

    expect(parte.sinPrueba).toBe(1)
    expect(parte.siguenVivos).toBe(1)
  })

  it('el que ya trabaja una propuesta va a omitidos, no a verificados', async () => {
    verificador('extinguido', null, 'sigue_vivo')

    const parte = await verificarTodos(banco(SEIS.slice(0, 3)), 'p1', deps())

    expect(parte).toMatchObject({ omitidos: 1, extinguidos: 1, siguenVivos: 1 })
    // A ese no lo miro ningun analista: contarlo diria que se verifico.
    expect(verificadosDe(parte)).toBe(2)
  })

  it('un desenlace que no sabemos nombrar se anuncia, no se diluye', async () => {
    verificador('extinguido', 'algo_nuevo')

    const parte = await verificarTodos(banco(SEIS.slice(0, 2)), 'p1', deps())

    expect(parte).toMatchObject({ sinClasificar: 1, extinguidos: 1 })
  })
})

describe('el golpecito del motor sale una vez por mitigado atendido', () => {
  it('seis atendidos, seis avisos: de ahi salen la tabla y el gasto del pie', async () => {
    verificador('extinguido', 'sin_prueba', null, 'sigue_vivo', 'extinguido', 'sin_prueba')
    const avisar = vi.fn()

    await verificarTodos(banco(SEIS), 'p1', deps({ avisar }))

    expect(avisar).toHaveBeenCalledTimes(6)
  })
})
