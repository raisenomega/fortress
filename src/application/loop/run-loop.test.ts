import { describe, expect, it, vi } from 'vitest'
import type { LoopDeps } from './loop-deps'
import { runLoop } from './run-loop'

const config = { projectId: 'p', costCap: 30, maxCycles: 5 }

/** Una vuelta que cerro una propuesta: lo normal, y lo que gasta tope. */
const CERRADA = { kind: 'integrada', proposalId: 'prop-1' }
const SIN_CANDIDATO = { kind: 'sin-candidato' }

function deps(over: Partial<LoopDeps> = {}): LoopDeps {
  return {
    scan: vi.fn().mockResolvedValue(50),
    fix: vi.fn().mockResolvedValue(CERRADA),
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
    const fix = vi.fn().mockResolvedValue(CERRADA)
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

  it('un arreglo que baja el score ya no para el loop: solo se anota', async () => {
    // Antes se abria el debate y, si ningun intento mejoraba, el loop moria.
    // Ahora el fix se juzga dentro del worktree y una bajada del arco es un
    // dato del arco, no un veredicto sobre el arreglo.
    const scan = vi.fn().mockResolvedValueOnce(80).mockResolvedValue(70)
    expect(await runLoop({ ...config, maxCycles: 2 }, deps({ scan }))).toBe('tope-ciclos')
  })

  it('una vuelta sin candidato no gasta tope', async () => {
    // El tope cuenta propuestas cerradas. Si no habia nada que reparar, el
    // motor no movio el expediente de nadie: contarla cobraria por no hacer.
    let gasto = 0
    const scan = vi.fn().mockImplementation(() => Promise.resolve((gasto += 12) && 50))
    const fix = vi.fn().mockResolvedValue(SIN_CANDIDATO)
    const reason = await runLoop({ ...config, maxCycles: 1 }, deps({ fix, scan, spentSession: () => gasto })) // prettier-ignore

    // Con el tope en 1, contar la vuelta habria parado el loop tras la primera.
    expect(fix).toHaveBeenCalledTimes(2)
    expect(reason).toBe('tope-gasto')
  })

  it('una vuelta que cierra propuesta si lo gasta', async () => {
    const fix = vi.fn().mockResolvedValue(CERRADA)
    expect(await runLoop({ ...config, maxCycles: 1 }, deps({ fix }))).toBe('tope-ciclos')
    expect(fix).toHaveBeenCalledTimes(1)
  })

  it('la cancelacion humana para en seco', async () => {
    expect(await runLoop(config, deps({ isCancelled: () => true }))).toBe('detenido')
  })
})
