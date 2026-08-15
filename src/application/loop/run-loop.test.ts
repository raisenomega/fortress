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

  it('un arreglo que baja el score ya no para el loop: solo se anota', async () => {
    // Antes se abria el debate y, si ningun intento mejoraba, el loop moria.
    // Ahora el fix se juzga dentro del worktree y una bajada del arco es un
    // dato del arco, no un veredicto sobre el arreglo.
    const scan = vi.fn().mockResolvedValueOnce(80).mockResolvedValue(70)
    expect(await runLoop({ ...config, maxCycles: 2 }, deps({ scan }))).toBe('tope-ciclos')
  })

  it('la cancelacion humana para en seco', async () => {
    expect(await runLoop(config, deps({ isCancelled: () => true }))).toBe('detenido')
  })
})
