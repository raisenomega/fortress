import { describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import { createMemoryDb } from '../persistence/memory-db'
import { createSqliteSelfObservationRepository } from '../persistence/sqlite-self-observation-repository'
import { runEngine } from './loop-engine'

const estado = vi.hoisted(() => ({
  correr: (): Promise<string> => Promise.resolve('detenido'),
  onStandby: (() => {}) as (error: string) => void
}))

vi.mock('@application/loop/run-loop', () => ({ runLoop: () => estado.correr() }))
vi.mock('./loop-deps-factory', () => ({
  buildDeps: (params: { onStandby: (error: string) => void }) => (
    (estado.onStandby = params.onStandby),
    {}
  )
}))
vi.mock('./loop-registry', () => ({ sendLoopStatus: () => {} }))

function contexto(): AppContext {
  const project = { id: 'p1', name: 'Cliente ACME', path: '/tmp/cliente-loop', trusted: true }
  const AJUSTES: Record<string, string> = { loop_cost_cap_usd: '5', loop_max_cycles: '3' }
  return {
    projects: { findById: () => project },
    settings: { get: (k: string) => AJUSTES[k] ?? null },
    runs: { usageByProjectSince: () => ({}) },
    loopSessions: { get: () => null, save: () => {}, activeSessions: () => [] },
    selfObservations: createSqliteSelfObservationRepository(createMemoryDb())
  } as unknown as AppContext
}

describe('el motor del loop observa sus paradas y sus standbys (sub-pieza 4 del #5)', () => {
  it('una parada por TOPE deja una observacion con el motivo y la cifra', async () => {
    const ctx = contexto()
    estado.correr = () => Promise.resolve('tope-gasto')
    await runEngine(ctx, 'p1')

    expect(ctx.selfObservations.listOpen()).toMatchObject([
      { kind: 'limitacion', area: 'parada-del-loop', sourceProject: 'Cliente ACME' }
    ])
    expect(ctx.selfObservations.listOpen()[0]?.note).toContain('tope de gasto: $0.00 de $5.00')
  })

  it('un STANDBY deja la suya, y la parada a mano que sigue no deja ninguna', async () => {
    const ctx = contexto()
    estado.correr = () => (estado.onStandby('429 rate limit'), Promise.resolve('detenido'))
    await runEngine(ctx, 'p1')

    expect(ctx.selfObservations.listOpen()).toMatchObject([
      { kind: 'limitacion', area: 'standby-del-loop' }
    ])
  })

  it('romperse es un bug con el mensaje', async () => {
    const ctx = contexto()
    estado.correr = () => Promise.reject(new Error('el proceso termino con codigo 143'))
    await runEngine(ctx, 'p1')

    expect(ctx.selfObservations.listOpen()).toMatchObject([
      { kind: 'bug', area: 'parada-del-loop' }
    ])
  })

  it('terminar RESUELTO no observa nada', async () => {
    const ctx = contexto()
    estado.correr = () => Promise.resolve('resuelto')
    await runEngine(ctx, 'p1')

    expect(ctx.selfObservations.listOpen()).toEqual([])
  })
})
