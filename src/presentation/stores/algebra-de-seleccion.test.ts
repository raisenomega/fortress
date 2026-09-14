import { describe, expect, it } from 'vitest'
import { alternarTodos, alternarUno, podarSet } from './algebra-de-seleccion'

const set = (...ids: string[]): ReadonlySet<string> => new Set(ids)

describe('el atajo de la cabecera', () => {
  it('suma las visibles SIN tocar lo elegido en otros chips', () => {
    // La seleccion persiste al cambiar de chip: reemplazar el conjunto borraria
    // en silencio lo que el operador eligio en otra vista.
    const previo = set('deOtroChip', 'a')

    expect([...alternarTodos(previo, ['a', 'b'])]).toEqual(['deOtroChip', 'a', 'b'])
  })

  it('y el segundo clic las resta, tambien sin tocar las de fuera', () => {
    const previo = set('deOtroChip', 'a', 'b')

    expect([...alternarTodos(previo, ['a', 'b'])]).toEqual(['deOtroChip'])
  })

  it('resta SOLO si estaban TODAS: con algunas, suma las que faltan', () => {
    expect([...alternarTodos(set('a'), ['a', 'b'])]).toEqual(['a', 'b'])
  })

  it('sin visibles no hace nada, y devuelve el mismo conjunto', () => {
    const previo = set('a')

    expect(alternarTodos(previo, [])).toBe(previo)
  })
})

describe('alternar uno', () => {
  it('pone el que no esta y quita el que esta', () => {
    expect([...alternarUno(set('a'), 'b')]).toEqual(['a', 'b'])
    expect([...alternarUno(set('a', 'b'), 'a')]).toEqual(['b'])
  })
})

describe('la poda', () => {
  it('quita los que ya no estan en la tabla', () => {
    expect([...podarSet(set('a', 'b', 'c'), ['a', 'c'])]).toEqual(['a', 'c'])
  })

  it('si no sobra ninguno devuelve EL MISMO: un repintado de balde por recarga', () => {
    const previo = set('a')

    expect(podarSet(previo, ['a', 'b'])).toBe(previo)
  })
})
