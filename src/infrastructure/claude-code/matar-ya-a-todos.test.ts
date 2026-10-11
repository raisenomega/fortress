import type { ChildProcess } from 'child_process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { killAllChildren, liveChildCount, matarYaATodos, trackChild } from './child-registry'

/** PASO 153: el APAGADO mata YA. A diferencia del Detener (SIGTERM + 3s SIGKILL
 *  con timer unref), `matarYaATodos` manda SIGKILL SINCRONO —el unref no dispara
 *  en un loop que se muere y el hijo con pipes abiertos retiene el main—. */
function fakeChild(): ChildProcess & { killed: string[] } {
  const child = {
    killed: [] as string[],
    kill: (signal: string) => void child.killed.push(signal),
    once: () => child
  }
  return child as unknown as ChildProcess & { killed: string[] }
}

beforeEach(() => {
  vi.useFakeTimers()
  killAllChildren()
})
afterEach(() => vi.useRealTimers())

describe('matarYaATodos: SIGKILL sincrono en el apagado', () => {
  it('SIGKILL YA a todos, sin avanzar timers, y el registro queda vacio', () => {
    const a = fakeChild()
    const b = fakeChild()
    trackChild(a)
    trackChild(b)
    expect(matarYaATodos()).toBe(2)
    expect(a.killed).toEqual(['SIGKILL'])
    expect(b.killed).toEqual(['SIGKILL'])
    expect(liveChildCount()).toBe(0)
  })
})
