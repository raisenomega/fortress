import { beforeEach, describe, expect, it } from 'vitest'
import { useTableroStore } from './tablero-store'

const store = (): ReturnType<typeof useTableroStore.getState> => useTableroStore.getState()
const del = (pid: string): ReadonlySet<string> => store().seleccion[pid] ?? new Set()

beforeEach(() => useTableroStore.setState({ severidad: {}, estado: {}, seleccion: {} }))

describe('la seleccion persiste al cambiar de chip', () => {
  it('elegir tres y saltar de chip no pierde ninguno', () => {
    // Elegir cinco, saltar a otro chip para mirar algo y volver es como se
    // trabaja de verdad: vaciar la seleccion castigaria justo eso.
    for (const id of ['a', 'b', 'c']) store().alternar('p1', id)

    store().setSeveridad('p1', 'HIGH')
    store().setEstado('p1', 'mitigados')

    expect([...del('p1')]).toEqual(['a', 'b', 'c'])
  })

  it('cada proyecto lleva la suya: cambiar de proyecto no mezcla', () => {
    store().alternar('p1', 'a')
    store().alternar('p2', 'z')

    expect([...del('p1')]).toEqual(['a'])
    expect([...del('p2')]).toEqual(['z'])
  })

  it('alternar quita lo que ya estaba', () => {
    store().alternar('p1', 'a')
    store().alternar('p1', 'a')

    expect(del('p1').size).toBe(0)
  })
})

describe('la poda quita los fantasmas', () => {
  it('lo que ya no esta en la tabla sale del Set', () => {
    // Un extinguido desaparece de la lista; su id se quedaria para siempre y la
    // barra diria «3 seleccionados» con dos filas delante.
    for (const id of ['a', 'b', 'c']) store().alternar('p1', id)

    store().podar('p1', ['a', 'c'])

    expect([...del('p1')]).toEqual(['a', 'c'])
  })

  it('si no sobra ninguno NO crea objeto nuevo: un render de balde por recarga', () => {
    store().alternar('p1', 'a')
    const antes = del('p1')

    store().podar('p1', ['a', 'b'])

    expect(del('p1')).toBe(antes)
  })

  it('podar sin seleccion no rompe ni inventa', () => {
    store().podar('p1', ['a'])

    expect(store().seleccion.p1).toBeUndefined()
  })
})
