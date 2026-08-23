import type { ChildProcess } from 'child_process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { killAllChildren, killChildrenOf, liveChildCount, trackChild } from './child-registry'

/** Proceso de mentira que apunta las senales que recibe. */
function fakeChild(): ChildProcess & { killed: string[] } {
  const listeners: Record<string, Array<() => void>> = {}
  const child = {
    killed: [] as string[],
    kill: (signal: string) => (child.killed.push(signal), true),
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

describe('parar un proyecto no toca el trabajo de otro', () => {
  it('mata los hijos del proyecto que paro y deja vivos los del otro', () => {
    // El caso real: mailbd escaneando mientras el operador para el drenaje de
    // FORTRESS. El escaneo de mailbd moria, y encima como averia del proveedor.
    const mio = fakeChild()
    const ajeno = fakeChild()
    trackChild(mio, 'proyecto-A')
    trackChild(ajeno, 'proyecto-B')

    expect(killChildrenOf('proyecto-A')).toBe(1)

    expect(mio.killed).toEqual(['SIGTERM'])
    expect(ajeno.killed).toEqual([])
    expect(liveChildCount()).toBe(1)
  })

  it('un hijo sin dueno no lo para ningun proyecto', () => {
    // El login y los sandboxes de aprendizaje no son de nadie.
    const login = fakeChild()
    trackChild(login)

    expect(killChildrenOf('proyecto-A')).toBe(0)
    expect(login.killed).toEqual([])
  })

  it('parar un proyecto sin hijos no molesta a nadie', () => {
    const otro = fakeChild()
    trackChild(otro, 'proyecto-B')

    expect(killChildrenOf('proyecto-A')).toBe(0)
    expect(otro.killed).toEqual([])
  })
})

describe('el boton de mantenimiento si mata todo', () => {
  it('alcanza a los de cualquier proyecto y a los que no tienen', () => {
    trackChild(fakeChild(), 'proyecto-A')
    trackChild(fakeChild(), 'proyecto-B')
    trackChild(fakeChild())

    expect(killAllChildren()).toBe(3)
    expect(liveChildCount()).toBe(0)
  })
})
