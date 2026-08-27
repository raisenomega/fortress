import { describe, expect, it } from 'vitest'
import { STALE_MS } from '@domain/graph/reindex-decision'
import { bench } from './reconcile-graph-fixture'
import { reconcileGraph } from './reconcile-graph'

const SHA = 'a'.repeat(40)

describe('reconcileGraph', () => {
  it('alineado e IDLE: SKIPPED, sin markRunning', async () => {
    const b = bench({ state: { indexedSha: SHA } })
    expect(await reconcileGraph(b.context, 'p1', b.deps)).toBe('SKIPPED')
    expect(b.marks).toEqual([])
  })

  it('nunca indexado: STARTED, markRunning y trabajo encolado', async () => {
    const b = bench()
    expect(await reconcileGraph(b.context, 'p1', b.deps)).toBe('STARTED')
    expect(b.marks).toEqual(['running'])
    expect(b.notified).toEqual(['p1'])
  })

  it('RUNNING reciente: SKIPPED (no se duplica la corrida)', async () => {
    const b = bench({ state: { status: 'RUNNING', startedAt: 999_000 }, now: 1_000_000 })
    expect(await reconcileGraph(b.context, 'p1', b.deps)).toBe('SKIPPED')
  })

  it('RUNNING huerfano (> STALE_MS): STARTED via RECLAIM_STALE', async () => {
    const b = bench({ state: { status: 'RUNNING', startedAt: 1_000_000 - STALE_MS - 1 } })
    expect(await reconcileGraph(b.context, 'p1', b.deps)).toBe('STARTED')
  })

  it('runner ok: markSuccess con el SHA que el runner reporto', async () => {
    const b = bench({ runnerResult: { ok: true, sha: 'b'.repeat(40) } })
    await reconcileGraph(b.context, 'p1', b.deps)
    await b.runQueued()
    expect(b.marks).toEqual(['running', 'success:bbb'])
    expect(b.notified).toEqual(['p1', 'p1'])
  })

  it('runner con error: markError con el mensaje', async () => {
    const b = bench({ runnerResult: { ok: false, error: 'kaput' } })
    await reconcileGraph(b.context, 'p1', b.deps)
    await b.runQueued()
    expect(b.marks).toEqual(['running', 'error:kaput'])
  })
})

describe('reconcileGraph en el arranque', () => {
  it('EN EL ARRANQUE ese mismo RUNNING reciente arranca: la corrida murio', async () => {
    // El grafo se quedo colgado justo aqui: cierre y relanzamiento, y la marca
    // de hacia 25 segundos se respeto durante 15 minutos sin nadie indexando.
    const b = bench({ state: { status: 'RUNNING', startedAt: 999_000 }, now: 1_000_000 })
    expect(await reconcileGraph(b.context, 'p1', b.deps, true)).toBe('STARTED')
    expect(b.marks).toEqual(['running'])
  })
})
