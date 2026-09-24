import { describe, expect, it } from 'vitest'
import type { AppContext } from '@application/context'
import { isRunning } from '../run-control'
import { cancelLoop, clearLoop, markRunning } from './loop-registry'
import { loopScan } from './loop-ops'

const P = 'loop-parado-test'

/** Revienta si el escaneo llega a ARMARSE: que reviente es la prueba de que se armo. */
const contexto = {
  projects: { findById: () => ({ id: P, path: '/repo', contaminated: false }) },
  settings: { get: () => null },
  runs: { usageSince: () => ({ costUsd: 0, count: 0 }), countUnmeasuredSince: () => 0 },
  get apiKeys(): never {
    throw new Error('se armo el escaneo')
  }
} as unknown as AppContext

describe('la parada del loop se honra ANTES de reservar el carril y de armar el escaneo', () => {
  it('con el loop parado no se arma nada, no se toma el carril, y se dice', async () => {
    // El caso medido el 2026-09-24: la parada llego mientras el motor iba hacia
    // el escaneo, `tryBeginRun` borro la marca de cancelado, y el juez del
    // alcance se lanzo igual sobre el repo propio, huerfano tras salir la app.
    markRunning(P)
    cancelLoop(P)
    try {
      const r = await loopScan(contexto, P, () => {})
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error).toMatch(/se detuvo/)
      expect(isRunning(P)).toBe(false)
    } finally {
      clearLoop(P)
    }
  })

  it('con el loop vivo el escaneo se arma (y aqui revienta: esa es la prueba)', async () => {
    markRunning(P)
    try {
      const r = await loopScan(contexto, P, () => {})
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error).toContain('se armo el escaneo')
    } finally {
      clearLoop(P)
    }
  })
})
