import { beforeEach, describe, expect, it } from 'vitest'
import { TOPE_DEL_LOTE } from '@domain/chat/lote-del-terminal'
import { useColaDelLoteStore } from './cola-del-lote-store'
import { useLoteStore } from './lote-store'

describe('la seleccion del lote, por proyecto y con tope', () => {
  beforeEach(() => {
    useLoteStore.getState().limpiar('p1')
    useLoteStore.getState().limpiar('p2')
  })

  it(`entran ${TOPE_DEL_LOTE}; el siguiente no, y alternar devuelve false para avisar`, () => {
    for (let i = 0; i < TOPE_DEL_LOTE; i += 1) {
      expect(useLoteStore.getState().alternar('p1', `f${i}`)).toBe(true)
    }
    expect(useLoteStore.getState().alternar('p1', `f${TOPE_DEL_LOTE}`)).toBe(false)
    expect(useLoteStore.getState().seleccion.p1?.size).toBe(TOPE_DEL_LOTE)
  })

  it('es por proyecto: el lote de uno no toca el de otro', () => {
    useLoteStore.getState().alternar('p1', 'a')
    expect(useLoteStore.getState().seleccion.p2?.size ?? 0).toBe(0)
  })
})

describe('Detener corta solo el lote de su proyecto', () => {
  beforeEach(() => useColaDelLoteStore.getState().terminar())

  it('con el lote de p1 corriendo, cortar p1 lo corta', () => {
    useColaDelLoteStore.getState().arrancar('p1', 3)
    useColaDelLoteStore.getState().cortar('p1')
    expect(useColaDelLoteStore.getState().cortado).toBe(true)
  })

  it('cortar p2 no toca el lote de p1', () => {
    useColaDelLoteStore.getState().arrancar('p1', 3)
    useColaDelLoteStore.getState().cortar('p2')
    expect(useColaDelLoteStore.getState().cortado).toBe(false)
  })

  it('un Detener sin lote corriendo no deja armado el corte para el siguiente', () => {
    useColaDelLoteStore.getState().cortar('p1')
    useColaDelLoteStore.getState().arrancar('p1', 2)
    expect(useColaDelLoteStore.getState().cortado).toBe(false)
  })
})
