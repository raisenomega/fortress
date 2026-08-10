import { describe, expect, it } from 'vitest'
import type { Proposal } from '@domain/repair/proposal'
import type { ProposalPatch } from '@domain/repair/proposal-repository'
import type { AppContext } from '../context'
import { reclaimWorktrees, type ReclaimDeps } from './reclaim-worktrees'

function bench(
  dirs: string[],
  proposals: Record<string, Partial<Proposal>>
): {
  context: AppContext
  deps: ReclaimDeps
  patches: Array<ProposalPatch & { id: string }>
  removed: string[]
} {
  const patches: Array<ProposalPatch & { id: string }> = []
  const removed: string[] = []
  const context = {
    projects: { findById: () => ({ id: 'p1', path: '/repo/vivo' }) },
    repairProposals: {
      findById: (id: string) => {
        const base = proposals[id]
        return base === undefined ? null : ({ id, projectId: 'p1', findingId: 'f', baseSha: 'b', createdAt: 1, updatedAt: 1, ...base } as Proposal) // prettier-ignore
      },
      update: (id: string, patch: ProposalPatch): void => void patches.push({ id, ...patch })
    },
    eventLog: { list: () => Promise.resolve([]), record: () => Promise.resolve() }
  } as unknown as AppContext
  const deps: ReclaimDeps = {
    listWorktreeDirs: () => dirs,
    pathOf: (id) => `/wt/${id}`,
    removeWorktree: (path) => (removed.push(path), Promise.resolve()),
    rmDir: (path) => void removed.push(`rm:${path}`),
    now: () => 7
  }
  return { context, deps, patches, removed }
}

describe('reclaimWorktrees (arranque)', () => {
  it('dir sin propuesta: se borra a lo bruto (huerfano total)', async () => {
    const b = bench(['zombie'], {})
    expect(await reclaimWorktrees(b.context, b.deps)).toEqual({ reclaimed: 0, cleaned: 1 })
    expect(b.removed).toEqual(['rm:/wt/zombie'])
  })

  it('propuesta terminal con dir: worktree fuera', async () => {
    const b = bench(['t1'], { t1: { state: 'RECHAZADO' } })
    expect(await reclaimWorktrees(b.context, b.deps)).toEqual({ reclaimed: 0, cleaned: 1 })
    expect(b.removed).toEqual(['/wt/t1'])
    expect(b.patches).toEqual([])
  })

  it('ANALIZADO con dir = crash a medio generar: RECHAZADO huerfano + fuera', async () => {
    const b = bench(['a1'], { a1: { state: 'ANALIZADO', analysisVerdict: 'REAL' } })
    expect(await reclaimWorktrees(b.context, b.deps)).toEqual({ reclaimed: 1, cleaned: 0 })
    expect(b.patches.at(-1)).toMatchObject({ state: 'RECHAZADO', analysisReason: 'orphan_before_generate' }) // prettier-ignore
    expect(b.removed).toEqual(['/wt/a1'])
  })

  it('GENERADO con dir: se CONSERVA, lo espera I3+', async () => {
    const b = bench(['g1'], { g1: { state: 'GENERADO' } })
    expect(await reclaimWorktrees(b.context, b.deps)).toEqual({ reclaimed: 0, cleaned: 0 })
    expect(b.removed).toEqual([])
  })
})
