import type { ChildProcess } from 'child_process'
import { beforeEach, describe, expect, it } from 'vitest'
import { killAllChildren, liveChildCount, trackChild } from './child-registry'

/** Proceso de mentira: solo hace falta que registre kill y sus listeners. */
function fakeChild(): ChildProcess & { killed: string[]; close: () => void } {
  const listeners: Record<string, () => void> = {}
  const child = {
    killed: [] as string[],
    kill(signal: string) {
      child.killed.push(signal)
      return true
    },
    once(event: string, handler: () => void) {
      listeners[event] = handler
      return child
    },
    close: () => listeners.close?.()
  }
  return child as unknown as ChildProcess & { killed: string[]; close: () => void }
}

beforeEach(() => killAllChildren())

describe('child-registry', () => {
  it('cuenta los procesos vivos', () => {
    trackChild(fakeChild())
    trackChild(fakeChild())
    expect(liveChildCount()).toBe(2)
  })

  it('un proceso que termina solo deja de contar', () => {
    const child = fakeChild()
    trackChild(child)
    child.close()
    expect(liveChildCount()).toBe(0)
  })

  it('los termina con SIGTERM, no a lo bruto', () => {
    // SIGTERM le da al proceso ocasion de cerrar sus descriptores.
    const child = fakeChild()
    trackChild(child)
    killAllChildren()
    expect(child.killed).toEqual(['SIGTERM'])
  })

  it('devuelve cuantos habia para poder decirlo', () => {
    trackChild(fakeChild())
    trackChild(fakeChild())
    expect(killAllChildren()).toBe(2)
  })

  it('matar sin nada vivo no revienta', () => {
    expect(killAllChildren()).toBe(0)
  })
})
