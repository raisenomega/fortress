import { beforeEach, describe, expect, it } from 'vitest'
import { useColaDelLoteStore } from './cola-del-lote-store'

describe('el lote esperando en el punto de parada', () => {
  beforeEach(() => {
    useColaDelLoteStore.getState().descartar()
    useColaDelLoteStore.getState().terminar()
  })

  it('preparar guarda proyecto e ids, sin plan todavia; descartar lo quita', () => {
    useColaDelLoteStore.getState().preparar('p1', ['f1', 'f2'])
    expect(useColaDelLoteStore.getState().pendiente).toEqual({
      projectId: 'p1',
      ids: ['f1', 'f2'],
      planeado: false,
      veredicto: null
    })

    useColaDelLoteStore.getState().descartar()
    expect(useColaDelLoteStore.getState().pendiente).toBeNull()
  })

  it('el turno de plan lo marca planeado; el de otro proyecto no lo toca', () => {
    useColaDelLoteStore.getState().preparar('p1', ['f1'])

    useColaDelLoteStore.getState().marcarPlaneado('p2', null)
    expect(useColaDelLoteStore.getState().pendiente?.planeado).toBe(false)

    useColaDelLoteStore.getState().marcarPlaneado('p1', null)
    expect(useColaDelLoteStore.getState().pendiente?.planeado).toBe(true)
  })

  it('preparar NO arranca la cola: precargar no es ejecutar', () => {
    useColaDelLoteStore.getState().preparar('p1', ['f1'])
    expect(useColaDelLoteStore.getState().enCurso).toBeNull()
  })
})
