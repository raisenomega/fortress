import { beforeEach, describe, expect, it } from 'vitest'
import { notify, reportError, useToastStore } from './toast-store'

const tonos = (): readonly string[] => useToastStore.getState().toasts.map((t) => t.tone)

beforeEach(() => useToastStore.setState({ toasts: [] }))

describe('cada aviso se pinta por lo que es', () => {
  it('un fallo va en rojo', () => {
    reportError('sin Claude Code')
    expect(tonos()).toEqual(['error'])
  })

  it('un exito va en verde, no en rojo', () => {
    // Integrar un fix es la mejor noticia del sistema y se leia como un
    // problema: todos los avisos compartian el rojo de los errores.
    notify('Integrada. El repo ya lleva el fix.', 'ok')
    expect(tonos()).toEqual(['ok'])
  })

  it('lo que no es ni una cosa ni la otra va en neutro por defecto', () => {
    // Verde con checkmark afirmaria que todo salio bien; rojo, que fallo algo.
    notify('No hay hallazgo que reparar en este proyecto')
    expect(tonos()).toEqual(['aviso'])
  })

  it('el mismo texto con dos tonos son dos avisos, no uno agrupado', () => {
    notify('lo mismo', 'ok')
    notify('lo mismo', 'aviso')
    expect(tonos()).toEqual(['ok', 'aviso'])
  })

  it('el mismo texto con el mismo tono si se agrupa, como siempre', () => {
    notify('repetido', 'ok')
    notify('repetido', 'ok')
    expect(useToastStore.getState().toasts).toHaveLength(1)
    expect(useToastStore.getState().toasts[0]?.count).toBe(2)
  })
})
