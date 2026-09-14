import { afterEach, describe, expect, it, vi } from 'vitest'
import { verificadosDe } from '@domain/repair/verificacion-masiva'
import { recorrerVerificaciones } from './recorrer-verificaciones'
import { verificarTodos } from './verificar-todos'
import { banco, deps, mitigado, verificador } from './verificar-todos-fixture'

afterEach(() => vi.restoreAllMocks())

const SEIS = ['f0', 'f1', 'f2', 'f3', 'f4', 'f5'].map(mitigado)

/**
 * Los que NO se verificaron, repartidos por SU MOTIVO. Dos casillas y no una:
 * «verificar no le aplica» y «esta cogido» son hechos distintos, y con una sola
 * el segundo texto se pegaba a los dos.
 */
describe('el que no se verifica dice por que', () => {
  it('el que ya trabaja una propuesta va a su casilla, no a verificados', async () => {
    verificador('extinguido', null, 'sigue_vivo')

    // `f1` esta mitigado Y tiene propuesta viva: por eso se omitio.
    const parte = await verificarTodos(banco(SEIS.slice(0, 3), ['f1']), 'p1', deps())

    expect(parte).toMatchObject({ yaTrabajados: 1, noMitigados: 0 })
    // A ese no lo miro ningun analista: contarlo diria que se verifico.
    expect(verificadosDe(parte)).toBe(2)
  })

  it('y el que NO estaba mitigado va a OTRA casilla: no se puede decir lo mismo', async () => {
    // Por el bucle DIRECTO, que es el camino de la seleccion manual: un id
    // elegido a mano puede no estar mitigado, cosa que `verificarTodos` no
    // puede producir porque su lista sale de `filter(mitigado)`.
    //
    // La UI puede dejar colar uno asi; el parte no puede anunciarlo como «ya lo
    // trabaja una propuesta», que seria falso sobre algo intacto.
    verificador(null)
    const activo = { ...mitigado('f9'), lifecycle: 'ACTIVE' as const }

    const parte = await recorrerVerificaciones(banco([activo]), 'p1', ['f9'], deps())

    expect(parte).toMatchObject({ noMitigados: 1, yaTrabajados: 0, total: 1 })
  })
})
