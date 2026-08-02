import { describe, expect, it } from 'vitest'
import { usePushStore } from './push-store'

describe('push-store', () => {
  it('ata el resultado al proyecto que lo produjo', () => {
    // Global, el "Push bloqueado" de Omega aparecia tambien en la pantalla de
    // Nucleo, acusando de tener CRITICALs a un proyecto que no los tenia.
    usePushStore.getState().startPush('omega')
    usePushStore.getState().finishPush('omega', 'Hay CRITICAL sin resolver', true)

    expect(usePushStore.getState().lastResult).toEqual({
      projectId: 'omega',
      output: 'Hay CRITICAL sin resolver',
      failed: true
    })
  })

  it('libera el boton al terminar, haya ido bien o mal', () => {
    usePushStore.getState().startPush('omega')
    expect(usePushStore.getState().pushingProjectId).toBe('omega')

    usePushStore.getState().finishPush('omega', 'fallo', true)
    expect(usePushStore.getState().pushingProjectId).toBeNull()
  })

  it('un push nuevo borra el resultado del anterior', () => {
    usePushStore.getState().finishPush('omega', 'error viejo', true)
    usePushStore.getState().startPush('nucleo')

    expect(usePushStore.getState().lastResult).toBeNull()
  })
})
