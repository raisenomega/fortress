import { describe, expect, it } from 'vitest'
import { baseCon, NUEVA, PROYECTO, VIEJA } from './red-de-la-fusion-fixture'
import { conIdentidadRepetida, conIdentidadVieja, sinTipoDeDefecto } from './red-de-la-fusion'

/**
 * Estos cuatro criterios vivieron en `scripts/`, que vitest no mira, hasta que
 * el inventario del 2026-09-06 lo hizo notar: la red del momento mas
 * irreversible del sistema era la unica pieza sin test del gate.
 */
describe('criterio 1: ninguna viva con la identidad de la formula vieja', () => {
  it('delata a la que sigue con SEVERIDAD|fichero|titulo, y dice cual', () => {
    const db = baseCon([{ id: 'a', identity: VIEJA }])

    const [v] = conIdentidadVieja(db, PROYECTO)

    expect(v.criterio).toBe(1)
    expect(v.quien).toBe('a')
    expect(v.detalle).toContain(VIEJA)
  })

  it('calla con la clave de hoy, y calla con una vieja ya EXTINCT', () => {
    // La segunda es el caso que importa: al migrar quedan viejas extintas, y un
    // criterio que las contara nunca dejaria cerrar la transaccion.
    const db = baseCon([
      { id: 'a', identity: NUEVA },
      { id: 'b', identity: VIEJA, lifecycle: 'EXTINCT' }
    ])

    expect(conIdentidadVieja(db, PROYECTO)).toEqual([])
  })
})

describe("criterio 2: ninguna reclasificada se queda en 'otro'", () => {
  it('delata a la que no recibio tipo', () => {
    const db = baseCon([{ id: 'a', identity: NUEVA, tipo: 'otro' }])

    expect(sinTipoDeDefecto(db, PROYECTO, [])).toHaveLength(1)
    expect(sinTipoDeDefecto(db, PROYECTO, [])[0].criterio).toBe(2)
  })

  it('calla si esa misma esta exenta: no le falta tipo, le falta juicio', () => {
    const db = baseCon([{ id: 'a', identity: NUEVA, tipo: 'otro' }])

    expect(sinTipoDeDefecto(db, PROYECTO, ['a'])).toEqual([])
  })
})

describe('criterio 3: ninguna identidad repetida entre vivas', () => {
  it('delata la clave compartida y cuantas la comparten', () => {
    const db = baseCon([
      { id: 'a', identity: NUEVA },
      { id: 'b', identity: NUEVA }
    ])

    const [v] = conIdentidadRepetida(db, PROYECTO)

    expect(v.criterio).toBe(3)
    expect(v.quien).toBe(NUEVA)
    expect(v.detalle).toContain('2')
  })

  it('calla cuando la segunda ya fue absorbida: fundir es justo esto', () => {
    const db = baseCon([
      { id: 'a', identity: NUEVA },
      { id: 'b', identity: `fusionada:a|${NUEVA}`, lifecycle: 'EXTINCT' }
    ])

    expect(conIdentidadRepetida(db, PROYECTO)).toEqual([])
  })
})
