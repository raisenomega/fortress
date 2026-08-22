import { describe, expect, it, vi } from 'vitest'
import { config, deps } from './run-loop-fixture'
import { runLoop } from './run-loop'

const ESPERA_OMEGA = { kind: 'espera-omega', proposalId: 'prop-1' }

describe('el loop en modo hasta-gate sigue teniendo frenos', () => {
  it('cada parada en el gate gasta tope de ciclos: para a los 5', async () => {
    // Si `espera-omega` no contase como ciclo, el tope no frenaria nunca y el
    // loop acumularia propuestas hasta agotar el dinero. Cuenta.
    const fix = vi.fn().mockResolvedValue(ESPERA_OMEGA)

    expect(await runLoop(config, deps({ fix }))).toBe('tope-ciclos')
    expect(fix).toHaveBeenCalledTimes(config.maxCycles)
  })

  it('el tope de gasto sigue mandando por encima del de ciclos', async () => {
    const fix = vi.fn().mockResolvedValue(ESPERA_OMEGA)
    const caro = deps({ fix, spentSession: () => config.costCap })

    expect(await runLoop(config, caro)).toBe('tope-gasto')
    expect(fix).not.toHaveBeenCalled()
  })

  it('acumular en el gate no dispara sin-avance: es trabajo hecho', async () => {
    // La racha de no-avance existe para cortar cuando el motor no acierta. En
    // hasta-gate TODAS las vueltas buenas acaban aqui, y contarlas como
    // fracasos mataria el modo entero en tres vueltas.
    const fix = vi.fn().mockResolvedValue(ESPERA_OMEGA)
    const estricto = deps({ fix, maxConsecutiveDiscarded: () => 2 })

    expect(await runLoop(config, estricto)).toBe('tope-ciclos')
  })
})
