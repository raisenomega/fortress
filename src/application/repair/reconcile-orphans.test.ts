import { describe, expect, it } from 'vitest'
import { RECLAIM_REASONS } from '@domain/repair/reclaim-reasons'
import { banco } from './reconcile-orphans-fixture'
import { reconcileOrphanProposals } from './reconcile-orphans'

describe('reconcileOrphanProposals: el merge que git confirma', () => {
  it('propuesta viva CON worktree en disco no se toca', async () => {
    const b = banco({ state: 'OMEGA', dirs: ['p-1'], merged: true })
    expect(await reconcileOrphanProposals(b.context, b.deps)).toEqual({ merged: 0, expired: 0 })
    expect(b.patches).toHaveLength(0)
  })

  it('sin worktree y con commit ya en HEAD: OMEGA pasa por APROBADO hasta MERGEADO', async () => {
    const b = banco({ state: 'OMEGA', merged: true })
    expect(await reconcileOrphanProposals(b.context, b.deps)).toEqual({ merged: 1, expired: 0 })
    expect(b.patches.map((p) => p.state)).toEqual(['APROBADO', 'MERGEADO'])
    expect(b.patches[1].analysisReason).toBe(RECLAIM_REASONS.MERGE_DETECTADO)
  })

  it('el libro registra el salto con sus estados de origen y destino', async () => {
    const b = banco({ state: 'OMEGA', merged: true })
    await reconcileOrphanProposals(b.context, b.deps)
    expect(b.events.map((e) => [e.fromState, e.toState])).toEqual([
      ['OMEGA', 'APROBADO'],
      ['APROBADO', 'MERGEADO']
    ])
    expect(b.events.map((e) => e.phase)).toEqual(['APPROVE', 'MERGE'])
  })

  it('desde GENERADO no hay camino honesto a MERGEADO aunque git lo confirme', async () => {
    const b = banco({ state: 'GENERADO', merged: true })
    expect(await reconcileOrphanProposals(b.context, b.deps)).toEqual({ merged: 0, expired: 1 })
    expect(b.patches[0].state).toBe('CADUCADO')
  })
})

describe('reconcileOrphanProposals: cada caducidad con su razon', () => {
  it('sin merge demostrable: CADUCADO por worktree ausente', async () => {
    const b = banco({ state: 'OMEGA', merged: false })
    expect(await reconcileOrphanProposals(b.context, b.deps)).toEqual({ merged: 0, expired: 1 })
    expect(b.patches[0]).toMatchObject({
      state: 'CADUCADO',
      analysisReason: RECLAIM_REASONS.WORKTREE_AUSENTE
    })
  })

  it('ANALIZADO esperando a que el operador genere NO se caduca', async () => {
    const b = banco({ state: 'ANALIZADO', commitSha: null })
    expect(await reconcileOrphanProposals(b.context, b.deps)).toEqual({ merged: 0, expired: 0 })
    expect(b.patches).toHaveLength(0)
  })

  it('sin commit en el libro no falta ningun worktree: no se toca', async () => {
    const b = banco({ state: 'GENERADO', commitSha: null, merged: true })
    await reconcileOrphanProposals(b.context, b.deps)
    expect(b.patches).toHaveLength(0)
  })

  it('proyecto ausente: razon propia, no la del worktree', async () => {
    const b = banco({ state: 'OMEGA', repoPath: null, merged: true })
    await reconcileOrphanProposals(b.context, b.deps)
    expect(b.patches[0].analysisReason).toBe(RECLAIM_REASONS.PROYECTO_AUSENTE)
  })
})
