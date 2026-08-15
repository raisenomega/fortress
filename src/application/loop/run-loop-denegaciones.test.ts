import { describe, expect, it, vi } from 'vitest'
import { runLoop } from './run-loop'
import { CERRADA, config, deps, esperaFirma } from './run-loop-fixture'

/** Tope alto de propuestas: lo que se mide aqui es la racha, no el conteo. */
const holgado = { ...config, maxCycles: 50 }

describe('runLoop: la racha de denegaciones', () => {
  it('tres denegaciones seguidas paran el loop cuando el tope son tres', async () => {
    const fix = vi.fn().mockResolvedValue(esperaFirma('blacklist'))
    const reason = await runLoop(holgado, deps({ fix, maxConsecutiveDenials: () => 3 }))

    expect(reason).toBe('tope-denegaciones')
    expect(fix).toHaveBeenCalledTimes(3)
  })

  it('una integracion borra la racha', async () => {
    // Denegada, denegada, integrada, denegada, denegada: cinco vueltas y nunca
    // tres seguidas. Sin el reset, la tercera denegacion habria parado el loop.
    const fix = vi
      .fn()
      .mockResolvedValueOnce(esperaFirma('diff'))
      .mockResolvedValueOnce(esperaFirma('files'))
      .mockResolvedValueOnce(CERRADA)
      .mockResolvedValueOnce(esperaFirma('diff'))
      .mockResolvedValue(esperaFirma('files'))
    const reason = await runLoop({ ...config, maxCycles: 5 }, deps({ fix, maxConsecutiveDenials: () => 3 })) // prettier-ignore

    expect(reason).toBe('tope-ciclos')
    expect(fix).toHaveBeenCalledTimes(5)
  })

  it('la integracion apagada por diseno no suma a la racha', async () => {
    // El proyecto que apago la integracion quiere firmar a mano: cada propuesta
    // aprobada sale por esa puerta, y contarla lo frenaria por elegir bien.
    const fix = vi.fn().mockResolvedValue(esperaFirma('disabled'))
    const reason = await runLoop({ ...config, maxCycles: 4 }, deps({ fix, maxConsecutiveDenials: () => 2 })) // prettier-ignore

    expect(reason).toBe('tope-ciclos')
  })

  it('aprobada sin llegar a mirar la politica tampoco suma', async () => {
    const fix = vi.fn().mockResolvedValue(esperaFirma(null))
    const reason = await runLoop({ ...config, maxCycles: 4 }, deps({ fix, maxConsecutiveDenials: () => 2 })) // prettier-ignore

    expect(reason).toBe('tope-ciclos')
  })
})
