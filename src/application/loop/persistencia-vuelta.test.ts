import { describe, expect, it, vi } from 'vitest'
import { config, deps, CERRADA, SIN_CANDIDATO } from './run-loop-fixture'
import { runLoop } from './run-loop'

/** Lo que la sesion habria guardado, vuelta a vuelta. */
function guardado(): { persist: (s: readonly number[], c: number) => void; filas: number[] } {
  const filas: number[] = []
  return { persist: (_scores, cyclesDone) => void filas.push(cyclesDone), filas }
}

describe('el contador se guarda en cada vuelta, no solo al medir', () => {
  it('sin re-escaneo el contador guardado sigue al vivo', async () => {
    // rescanEvery alto: el ciclo no vuelve a medir en toda la sesion, que es
    // justo lo que pasa en un proyecto donde nada se integra.
    const { persist, filas } = guardado()
    await runLoop({ ...config, maxCycles: 3 }, deps({ persist, rescanEvery: () => 99 }))

    // El cero de cabeza es el escaneo base, que ya persistia antes del cambio.
    expect(filas).toEqual([0, 1, 2, 3])
  })

  it('una vuelta sin candidato no gasta tope y guarda el contador quieto', async () => {
    const { persist, filas } = guardado()
    const fix = vi.fn().mockResolvedValueOnce(SIN_CANDIDATO).mockResolvedValue(CERRADA)
    await runLoop({ ...config, maxCycles: 2 }, deps({ persist, fix, rescanEvery: () => 99 }))

    expect(filas).toEqual([0, 0, 1, 2])
  })

  it('con re-escaneo se guarda dos veces en la vuelta, y la ultima manda', async () => {
    // Ninguna incoherencia: mismo upsert, estado mas fresco en la segunda.
    const { persist, filas } = guardado()
    await runLoop({ ...config, maxCycles: 1 }, deps({ persist, rescanEvery: () => 0 }))

    expect(filas).toEqual([0, 1, 1])
  })
})
