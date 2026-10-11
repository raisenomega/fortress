import { describe, expect, it, vi } from 'vitest'
import { hijoFalso } from '../claude-code/hijo-falso-fixture'

vi.mock('../persistence/database', () => ({ closeDatabase: vi.fn() }))

const { closeDatabase } = await import('../persistence/database')
const { liveChildCount, trackChild } = await import('../claude-code/child-registry')
const { alSalir } = await import('./al-salir')

describe('al salir la app no queda ningun hijo vivo (el juez huerfano del 2026-09-24)', () => {
  it('mata a TODOS los hijos YA —SIGKILL sincrono, sin esperar el timer— y cierra la base', () => {
    const conDueno = hijoFalso()
    const sinDueno = hijoFalso()
    trackChild(conDueno, 'p-quit')
    trackChild(sinDueno, null)

    alSalir()

    // El apagado fuerza: SIGKILL YA (PASO 153), no el SIGTERM+gracia del Detener.
    expect(conDueno.killed).toEqual(['SIGKILL'])
    expect(sinDueno.killed).toEqual(['SIGKILL'])
    expect(liveChildCount()).toBe(0)
    expect(closeDatabase).toHaveBeenCalledTimes(1)
  })
})
