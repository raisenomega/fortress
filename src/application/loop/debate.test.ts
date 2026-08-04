import { describe, expect, it, vi } from 'vitest'
import { runDebate } from './debate'
import type { LoopDeps } from './loop-deps'
import { freshProgress } from './loop-progress'

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

describe('runDebate', () => {
  it('acepta el primer intento que SUPERA el score previo', async () => {
    const scan = vi.fn().mockResolvedValue(90) // el intento mejora (90 > 80)
    const out = await runDebate(config, deps({ scan }), freshProgress(), 80)
    expect(out).toEqual({ score: 90, reason: null })
  })

  it('se rinde con sin-solucion si ningun intento mejora', async () => {
    const revert = vi.fn().mockResolvedValue(undefined)
    const out = await runDebate(config, deps({ scan: vi.fn().mockResolvedValue(70), revert }), freshProgress(), 80)
    expect(out).toEqual({ score: null, reason: 'sin-solucion' })
    // 1 revert del arreglo que empeoro + 1 por cada uno de los 2 intentos fallidos.
    expect(revert).toHaveBeenCalledTimes(3)
  })

  it('un intento que rompe el build se descarta (revierte) y prueba el siguiente', async () => {
    const verify = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true)
    const scan = vi.fn().mockResolvedValue(95)
    const out = await runDebate(config, deps({ verify, scan }), freshProgress(), 80)
    expect(out).toEqual({ score: 95, reason: null }) // el 2º intento compila y mejora
  })

  it('la cancelacion humana corta el debate', async () => {
    const out = await runDebate(config, deps({ isCancelled: () => true }), freshProgress(), 80)
    expect(out).toEqual({ score: null, reason: 'detenido' })
  })
})
