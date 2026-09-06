import { describe, expect, it } from 'vitest'
import type { AppContext } from '@application/context'
import { endRun, isRunning, tryBeginRun } from '../run-control'
import { loopScan } from './loop-ops'

const PROYECTO = 'carril-test'

/**
 * Contexto que deja pasar la reserva y REVIENTA justo despues, al armar el
 * escaner. Es el escenario exacto del defecto: `guardRun` ya tomo el carril y
 * lo que sigue falla.
 */
function contextoQueRevientaTrasReservar(): AppContext {
  return {
    projects: { findById: () => ({ id: PROYECTO, path: '/repo', contaminated: false }) },
    settings: { get: () => null },
    runs: { usageSince: () => ({ costUsd: 0, count: 0 }), countUnmeasuredSince: () => 0 },
    // Se lee DESPUES de reservar, al construir el agente. Ahi es donde revienta.
    get apiKeys(): never {
      throw new Error('el llavero no se pudo abrir')
    }
  } as unknown as AppContext
}

describe('un fallo despues de reservar NO deja el carril tomado', () => {
  it('el carril queda libre, y otro puede tomarlo', async () => {
    // Antes: el fallo saltaba por encima del `finally` y el proyecto se quedaba
    // sin chat, sin escaneo y sin loop hasta reiniciar la app.
    const r = await loopScan(contextoQueRevientaTrasReservar(), PROYECTO, () => {})

    expect(r.ok).toBe(false)
    expect(isRunning(PROYECTO)).toBe(false)
    expect(tryBeginRun(PROYECTO)).toBe(true) // el siguiente SI puede
    endRun(PROYECTO)
  })

  it('y el fallo se cuenta como fallo, no como silencio', async () => {
    const r = await loopScan(contextoQueRevientaTrasReservar(), PROYECTO, () => {})

    expect(r.ok === false && r.error).toContain('el llavero no se pudo abrir')
    endRun(PROYECTO)
  })
})
