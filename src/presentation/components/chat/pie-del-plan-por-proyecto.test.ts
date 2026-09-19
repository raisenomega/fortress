import { describe, expect, it } from 'vitest'
import { useColaDelLoteStore } from '../../stores/cola-del-lote-store'

describe('solo aparece cuando hay un plan de ESTE proyecto esperando', () => {
  const lee = (projectId: string): unknown => {
    const s = useColaDelLoteStore.getState()
    return s.pendiente?.projectId === projectId && s.pendiente.planeado ? s.pendiente : null
  }

  it('sin nada pendiente no hay pie que pintar', () => {
    useColaDelLoteStore.getState().descartar()

    expect(lee('p1')).toBeNull()
  })

  it('precargado pero SIN plan todavia: aun no hay nada que firmar', () => {
    useColaDelLoteStore.getState().preparar('p1', ['f1', 'f2'])

    expect(lee('p1')).toBeNull()
  })

  it('con la cola EN CURSO manda el estado de ejecucion, no el boton', () => {
    useColaDelLoteStore.getState().preparar('p1', ['f1'])
    useColaDelLoteStore.getState().marcarPlaneado('p1', null)
    useColaDelLoteStore.getState().arrancar('p1', 1)

    expect(useColaDelLoteStore.getState().enCurso?.projectId).toBe('p1')
    useColaDelLoteStore.getState().terminar()
  })

  it('con el plan ya escrito, el pie sale con sus N', () => {
    useColaDelLoteStore.getState().preparar('p1', ['f1', 'f2'])
    useColaDelLoteStore.getState().marcarPlaneado('p1', null)

    expect(lee('p1')).toMatchObject({ planeado: true, ids: ['f1', 'f2'] })
  })

  it('y en OTRO proyecto no sale: se firma el lote de quien lo pidio', () => {
    useColaDelLoteStore.getState().preparar('p1', ['f1'])
    useColaDelLoteStore.getState().marcarPlaneado('p1', null)

    expect(lee('p2')).toBeNull()
  })
})
