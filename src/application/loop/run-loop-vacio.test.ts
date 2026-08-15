import { describe, expect, it, vi } from 'vitest'
import { runLoop } from './run-loop'
import { CERRADA, config, deps, esperaFirma, SIN_CANDIDATO } from './run-loop-fixture'

/** Topes altos: lo que se mide aqui es cuando se da la baraja por agotada. */
const holgado = { ...config, maxCycles: 50 }

describe('runLoop: la baraja agotada', () => {
  it('tres vueltas seguidas en vacio con el tope en tres paran el loop', async () => {
    // Sin este freno el loop giraria para siempre: una vuelta sin candidato no
    // escanea, no gasta, no cierra propuesta y no cuenta como denegacion.
    const fix = vi.fn().mockResolvedValue(SIN_CANDIDATO)
    const reason = await runLoop(holgado, deps({ fix, maxConsecutiveNoCandidates: () => 3 }))

    expect(reason).toBe('pool-agotado')
    expect(fix).toHaveBeenCalledTimes(3)
  })

  it('basta un candidato para desmentir la racha entera', async () => {
    // Vacio, vacio, integrada, vacio, vacio: cinco vueltas y nunca tres
    // seguidas. Sin el reinicio, la tercera vuelta habria parado el loop.
    const fix = vi
      .fn()
      .mockResolvedValueOnce(SIN_CANDIDATO)
      .mockResolvedValueOnce(SIN_CANDIDATO)
      .mockResolvedValueOnce(CERRADA)
      .mockResolvedValueOnce(SIN_CANDIDATO)
      .mockResolvedValue(SIN_CANDIDATO)
    const reason = await runLoop({ ...config, maxCycles: 1 }, deps({ fix, maxConsecutiveNoCandidates: () => 3 })) // prettier-ignore

    expect(reason).toBe('tope-ciclos') // paro la unica integracion, no la racha
    expect(fix).toHaveBeenCalledTimes(3)
  })

  it('esperar firma tampoco es estar en vacio: reinicia la cuenta', async () => {
    const fix = vi
      .fn()
      .mockResolvedValueOnce(SIN_CANDIDATO)
      .mockResolvedValueOnce(esperaFirma('disabled'))
      .mockResolvedValue(SIN_CANDIDATO)
    const reason = await runLoop({ ...holgado, maxCycles: 3 }, deps({ fix, maxConsecutiveNoCandidates: () => 2 })) // prettier-ignore

    // Sin reinicio pararia en la segunda vuelta; con el, llega hasta la cuarta.
    expect(fix).toHaveBeenCalledTimes(4)
    expect(reason).toBe('pool-agotado')
  })
})
