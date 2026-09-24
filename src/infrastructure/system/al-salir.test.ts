import { describe, expect, it, vi } from 'vitest'
import { hijoFalso } from '../claude-code/hijo-falso-fixture'

vi.mock('../persistence/database', () => ({ closeDatabase: vi.fn() }))

const { closeDatabase } = await import('../persistence/database')
const { liveChildCount, trackChild } = await import('../claude-code/child-registry')
const { alSalir } = await import('./al-salir')

describe('al salir la app no queda ningun hijo vivo (el juez huerfano del 2026-09-24)', () => {
  it('mata a TODOS los hijos registrados, con dueño o sin el, y luego cierra la base', () => {
    const conDueno = hijoFalso()
    const sinDueno = hijoFalso()
    trackChild(conDueno, 'p-quit')
    trackChild(sinDueno, null)

    alSalir()

    expect(conDueno.killed).toEqual(['SIGTERM'])
    expect(sinDueno.killed).toEqual(['SIGTERM'])
    expect(liveChildCount()).toBe(0)
    expect(closeDatabase).toHaveBeenCalledTimes(1)
  })
})
