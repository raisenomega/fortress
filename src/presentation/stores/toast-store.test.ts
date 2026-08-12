import { beforeEach, describe, expect, it } from 'vitest'
import { reportError, useToastStore } from './toast-store'

// El store es un singleton: cada caso arranca con la pila vacia.
beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

describe('toast-store', () => {
  it('agrupa el mismo mensaje en un solo aviso con contador', () => {
    // Un efecto que corre dos veces apilaba dos avisos identicos, uno tapando
    // al otro, y el operador tenia que cerrarlos de uno en uno.
    reportError('No se pudo leer el documento')
    reportError('No se pudo leer el documento')

    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].count).toBe(2)
  })

  it('no agrupa mensajes distintos', () => {
    reportError('No se pudo leer el documento')
    reportError('No se pudo guardar el tope de gasto')

    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(2)
    expect(toasts.map((t) => t.count)).toEqual([1, 1])
  })

  it('cierra el aviso agrupado de una vez, no una por emision', () => {
    reportError('Fallo al reintentar')
    reportError('Fallo al reintentar')

    const [toast] = useToastStore.getState().toasts
    useToastStore.getState().dismiss(toast.id)

    expect(useToastStore.getState().toasts).toHaveLength(0)
  })
})
