import { describe, expect, it } from 'vitest'
import { bench } from './reconcile-graph-fixture'
import { reconcileGraph } from './reconcile-graph'

const SHA = 'a'.repeat(40)
const STATS = { nodes: 1232, edges: 2524, files: 148, indexedAt: '2026-09-24T13:46:31Z', rootPath: '/repo' } // prettier-ignore

describe('reconcileGraph: has_graph dice si el indice existe en disco (pieza B del arco #4)', () => {
  it('sha alineado pero el .db no esta: has_graph a 0 y se reindexa (mailbd)', async () => {
    const b = bench({ state: { indexedSha: SHA }, indice: null })
    expect(await reconcileGraph(b.context, 'p1', b.deps)).toBe('STARTED')
    expect(b.grafo).toEqual(['clear'])
    expect(b.marks).toEqual(['running'])
  })

  it('sha alineado y el .db esta: has_graph a 1 con las stats del disco, y SKIP (los seis con 0)', async () => {
    const b = bench({ state: { indexedSha: SHA }, indice: STATS })
    expect(await reconcileGraph(b.context, 'p1', b.deps)).toBe('SKIPPED')
    expect(b.grafo).toEqual(['set:1232/2524@2026-09-24T13:46:31Z'])
  })

  it('runner ok y el .db esta: markSuccess y has_graph a 1 con las stats nuevas', async () => {
    const b = bench({ indice: null, runnerResult: { ok: true, sha: 'b'.repeat(40) }, indiceTrasIndexar: STATS }) // prettier-ignore
    await reconcileGraph(b.context, 'p1', b.deps)
    await b.runQueued()
    expect(b.marks).toEqual(['running', 'success:bbb'])
    expect(b.grafo).toEqual(['clear', 'set:1232/2524@2026-09-24T13:46:31Z'])
  })

  it('runner ok pero sin .db despues: es un error, no un exito con has_graph a 1', async () => {
    const b = bench({ indice: null, runnerResult: { ok: true, sha: 'b'.repeat(40) }, indiceTrasIndexar: null }) // prettier-ignore
    await reconcileGraph(b.context, 'p1', b.deps)
    await b.runQueued()
    expect(b.marks).toEqual(['running', 'error:indexado sin indice en disco'])
    expect(b.grafo).toEqual(['clear'])
  })

  it('sin repo git: ni toca has_graph ni decide nada (Trade99PRO)', async () => {
    const b = bench({ sha: null, indice: null })
    expect(await reconcileGraph(b.context, 'p1', b.deps)).toBe('SKIPPED')
    expect(b.grafo).toEqual([])
  })
})
