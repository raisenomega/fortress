import type { ChildProcess } from 'child_process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { killAllChildren, trackChild } from './claude-code/child-registry'
import { cancelRun, endRun, isCancelled, tryBeginRun } from './run-control'

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
  endRun('A')
  endRun('B')
})
afterEach(() => vi.useRealTimers())

describe('cancelRun es una decision sobre el trabajo propio', () => {
  it('el proyecto que no paro conserva su proceso Y su estado limpio', () => {
    const deA = fakeChild()
    const deB = fakeChild()
    trackChild(deA, 'A')
    trackChild(deB, 'B')
    tryBeginRun('A')
    tryBeginRun('B')

    cancelRun('A')

    expect(deA.killed).toEqual(['SIGTERM'])
    // Lo que costaba mas caro: B seguia trabajando, su hijo moria, y como B no
    // estaba cancelado su fallo se clasificaba como averia del proveedor.
    expect(deB.killed).toEqual([])
    expect(isCancelled('B')).toBe(false)
  })

  it('el que SI paro queda marcado, que es lo que distingue parada de fallo', () => {
    tryBeginRun('A')
    cancelRun('A')
    expect(isCancelled('A')).toBe(true)
  })

  it('devuelve cuantos proceso mato, no cuantos habia en la maquina', () => {
    trackChild(fakeChild(), 'A')
    trackChild(fakeChild(), 'B')
    trackChild(fakeChild(), 'B')

    expect(cancelRun('B')).toBe(2)
  })
})
