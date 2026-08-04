import { describe, expect, it, vi } from 'vitest'
import type { LoopDeps } from './loop-deps'
import { runLoop } from './run-loop'

const config = { projectId: 'p', costCap: 30, maxCycles: 5 }

function deps(over: Partial<LoopDeps> = {}): LoopDeps {
  return {
    scan: vi.fn().mockResolvedValue(50),
    fix: vi.fn().mockResolvedValue(undefined),
    verify: vi.fn().mockResolvedValue(true),
    snapshot: vi.fn().mockResolvedValue(undefined),
    revert: vi.fn().mockResolvedValue(undefined),
    spentSession: () => 0,
    isCancelled: () => false,
    wait: () => Promise.resolve(),
    emit: () => {},
    persist: () => {},
    ...over
  }
}

describe('runLoop', () => {
  it('para en 3 escaneos 100 seguidos, sin arreglar de mas', async () => {
    const fix = vi.fn().mockResolvedValue(undefined)
    const reason = await runLoop(config, deps({ scan: vi.fn().mockResolvedValue(100), fix }))
    expect(reason).toBe('resuelto')
    expect(fix).toHaveBeenCalledTimes(2) // arreglo en los dos primeros ciclos, no en el tercero
  })

  it('para por tope de ciclos cuando el score no llega a 100', async () => {
    expect(await runLoop({ ...config, maxCycles: 2 }, deps())).toBe('tope-ciclos')
  })

  it('el tope de gasto frena antes de escanear', async () => {
    const scan = vi.fn().mockResolvedValue(50)
    const reason = await runLoop(config, deps({ scan, spentSession: () => 30 }))
    expect(reason).toBe('tope-gasto')
    expect(scan).not.toHaveBeenCalled()
  })

  it('un build roto tras el arreglo revierte y detiene', async () => {
    const revert = vi.fn().mockResolvedValue(undefined)
    const reason = await runLoop(config, deps({ verify: vi.fn().mockResolvedValue(false), revert }))
    expect(reason).toBe('build-roto')
    expect(revert).toHaveBeenCalledTimes(1)
  })

  it('debate: si ningun intento mejora, revierte y para con sin-solucion', async () => {
    // Base 80; el arreglo y todo intento del debate dan 70 (siempre peor).
    const scan = vi.fn().mockResolvedValueOnce(80).mockResolvedValue(70)
    expect(await runLoop(config, deps({ scan }))).toBe('sin-solucion')
  })

  it('debate: si un intento mejora, el loop lo acepta y continua', async () => {
    // Base 80; el arreglo empeora a 70; el intento 1 del debate mejora a 90.
    const scan = vi
      .fn()
      .mockResolvedValueOnce(80)
      .mockResolvedValueOnce(70)
      .mockResolvedValueOnce(90)
      .mockResolvedValue(90)
    const fix = vi.fn().mockResolvedValue(undefined)
    const reason = await runLoop({ ...config, maxCycles: 1 }, deps({ scan, fix }))
    expect(reason).toBe('tope-ciclos') // acepta 90, cyclesDone=1, luego tope
    expect(fix).toHaveBeenCalledWith(1) // hubo una ronda de debate
  })

  it('la cancelacion humana para en seco', async () => {
    expect(await runLoop(config, deps({ isCancelled: () => true }))).toBe('detenido')
  })
})
