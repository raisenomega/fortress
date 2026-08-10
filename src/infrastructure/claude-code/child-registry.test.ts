import type { ChildProcess } from 'child_process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { killAllChildren, liveChildCount, trackChild } from './child-registry'

/** Proceso de mentira. `once` acumula listeners: el registro cuelga DOS de close
 *  (descontarse + cancelar la escalada) y pisarse uno era mentira del fake. */
function fakeChild(): ChildProcess & { killed: string[]; close: () => void } {
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
    },
    close: () => (listeners.close ?? []).forEach((handler) => handler())
  }
  return child as unknown as ChildProcess & { killed: string[]; close: () => void }
}

beforeEach(() => {
  vi.useFakeTimers()
  killAllChildren()
})
afterEach(() => vi.useRealTimers())

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

  it('primero SIGTERM: ocasion de cerrar descriptores antes de desaparecer', () => {
    const child = fakeChild()
    trackChild(child)
    killAllChildren()
    expect(child.killed).toEqual(['SIGTERM'])
  })

  it('un proceso que IGNORA el SIGTERM recibe SIGKILL a los 3s', () => {
    const child = fakeChild()
    trackChild(child)
    killAllChildren()

    vi.advanceTimersByTime(3000)
    expect(child.killed).toEqual(['SIGTERM', 'SIGKILL'])
  })

  it('un proceso que muere por las buenas NO recibe SIGKILL', () => {
    const child = fakeChild()
    trackChild(child)
    killAllChildren()
    child.close() // murio dentro del periodo de gracia
    vi.advanceTimersByTime(5000)
    expect(child.killed).toEqual(['SIGTERM'])
  })

  it('devuelve cuantos habia para poder decirlo, y matar sin nada vivo no revienta', () => {
    trackChild(fakeChild())
    trackChild(fakeChild())
    expect(killAllChildren()).toBe(2)
    expect(killAllChildren()).toBe(0)
  })
})
