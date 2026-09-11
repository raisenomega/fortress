import type { ChildProcess } from 'child_process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { killAllChildren, killChildrenOf, liveChildCount, trackChild } from './child-registry'

/** Molde de `child-registry.test`: `once` acumula, que el registro cuelga dos. */
function fakeChild(): ChildProcess & { killed: string[] } {
  const listeners: Record<string, Array<() => void>> = {}
  const child = {
    killed: [] as string[],
    kill(signal: string) {
      child.killed.push(signal)
      return true
    },
    once(event: string, handler: () => void) {
      ;(listeners[event] ??= []).push(handler)
      return child
    }
  }
  return child as unknown as ChildProcess & { killed: string[] }
}

beforeEach(() => {
  vi.useFakeTimers()
  killAllChildren()
})
afterEach(() => vi.useRealTimers())

/**
 * La red del escaneo ya no es el reloj, es este boton. Estos casos fijan que no
 * dependia del techo: `trackChild` y `killChildrenOf` no saben que existe un
 * timeout, y su SIGKILL llega igual con techo o sin el.
 */
describe('Detener mata sin depender del techo de tiempo', () => {
  it('SIGTERM y, a los 3 s, SIGKILL — que no se ignora', () => {
    const child = fakeChild()
    trackChild(child, 'p1')

    expect(killChildrenOf('p1')).toBe(1)
    expect(child.killed).toEqual(['SIGTERM'])

    vi.advanceTimersByTime(3000)

    expect(child.killed).toEqual(['SIGTERM', 'SIGKILL'])
  })

  it('alcanza solo a los del proyecto: el escaneo de otro no se lo lleva por delante', () => {
    const mio = fakeChild()
    const ajeno = fakeChild()
    trackChild(mio, 'p1')
    trackChild(ajeno, 'p2')

    killChildrenOf('p1')

    expect(mio.killed).toEqual(['SIGTERM'])
    expect(ajeno.killed).toEqual([])
  })

  it('un hijo SIN dueño no lo alcanza nadie: por eso el juez manda el suyo', () => {
    const huerfano = fakeChild()
    trackChild(huerfano, null)

    expect(killChildrenOf('p1')).toBe(0)
    expect(huerfano.killed).toEqual([])
    expect(liveChildCount()).toBe(1)
  })
})
