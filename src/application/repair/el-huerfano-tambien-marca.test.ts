import { describe, expect, it } from 'vitest'
import { RECLAIM_REASONS } from '@domain/repair/reclaim-reasons'
import { banco } from './reconcile-orphans-fixture'
import { reconcileOrphanProposals } from './reconcile-orphans'

/**
 * LA TERCERA VIA, y el dividendo de haber marcado en `advanceProposal` en vez
 * de en el merge.
 *
 * Un fix puede entrar al repo y dejar su propuesta colgada —la app se cierra a
 * media integracion, el worktree desaparece—. El reconciliador lo detecta al
 * arrancar preguntandole a git, y la lleva hasta MERGEADO. Si la marca viviera
 * en `applyAutoMerge`, ESTE camino se quedaria fuera y su hallazgo seguiria
 * ACTIVE para siempre, con el fix ya en main.
 */
describe('un merge detectado por el reconciliador tambien marca su hallazgo', () => {
  it('el huerfano que git confirma llega a MERGEADO Y marca el hallazgo', async () => {
    const b = banco({ state: 'OMEGA', merged: true })

    expect(await reconcileOrphanProposals(b.context, b.deps)).toEqual({ merged: 1, expired: 0 })

    expect(b.patches.map((p) => p.state)).toEqual(['APROBADO', 'MERGEADO'])
    expect(b.marcas).toEqual([
      { id: 'f-1', note: `el motor integro su fix: ${RECLAIM_REASONS.MERGE_DETECTADO}` }
    ])
  })

  it('pero el huerfano que git NO confirma caduca, y no marca nada', async () => {
    // Sin prueba de merge se caduca: el fix no entro, asi que no hay nada que
    // declarar arreglado. Es el mismo sesgo conservador de todo el reparto.
    const b = banco({ state: 'OMEGA', merged: false })

    expect(await reconcileOrphanProposals(b.context, b.deps)).toEqual({ merged: 0, expired: 1 })

    expect(b.patches.map((p) => p.state)).toEqual(['CADUCADO'])
    expect(b.marcas).toHaveLength(0)
  })
})
