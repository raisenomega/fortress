import { describe, expect, it } from 'vitest'
import type { Analysis } from '@domain/repair/analysis'
import type { Proposal } from '@domain/repair/proposal'
import type { AppContext } from '../context'
import { AT1, AT2, banco, clave, enLinea, fila, idDe, P } from '../../infrastructure/persistence/sync-con-alias-fixture' // prettier-ignore
import { fundirPorJuicio } from './fundir-por-juicio'

function escenario(): { context: AppContext; a: string; b: string; patches: object[] } {
  const { db, repo } = banco()
  repo.syncFromScan(P, 's1', [enLinea(10)], AT1)
  repo.syncFromScan(P, 's2', [enLinea(20)], AT2)
  const patches: object[] = []
  const context = { findings: repo, repairProposals: { update: (id: string, p: object): void => void patches.push({ id, ...p }) }, db } as unknown as AppContext // prettier-ignore
  return { context, a: idDe(db, clave(10)), b: idDe(db, clave(20)), patches }
}
const PROJECT = { id: P, name: 'P', path: '/p' } as never
const PROPOSAL = { id: 'prop', state: 'ANALIZADO' } as unknown as Proposal
// prettier-ignore
const analisis = (target: string, citados: readonly string[], dichos: readonly string[]): Analysis => ({ target: { id: target, hermanosCitados: citados } as never, status: 'REAL', whatToChange: '', where: '', patternToCopy: '', doNotTouch: '', risk: '', tokensUsed: 0, mismoDefectoQue: dichos })

describe('fundirPorJuicio en la aplicacion: el juicio del analista se persiste como fusion mas alias', () => {
  it('si el objetivo es el mas antiguo, absorbe al citado y la propuesta sigue', () => {
    const { context, a, b, patches } = escenario()
    expect(fundirPorJuicio(context, PROJECT, PROPOSAL, analisis(a, [b], [b]))).toBeNull()
    expect(fila((context as unknown as { db: never }).db, b)).toMatchObject({ lifecycle: 'EXTINCT', extinct_reason: `fusionada-con-${a}` }) // prettier-ignore
    expect(patches).toEqual([])
  })

  it('si el citado es mas antiguo, el objetivo queda absorbido y la propuesta caduca diciendo con quien', () => {
    const { context, a, b, patches } = escenario()
    const patch = fundirPorJuicio(context, PROJECT, PROPOSAL, analisis(b, [a], [a]))
    expect(patch).toMatchObject({ state: 'CADUCADO', analysisReason: `fusionada-con-${a}` })
    expect(patches).toHaveLength(1)
  })

  it('un id que no fue citado no funde nada (fail-closed)', () => {
    const { context, a, b, patches } = escenario()
    expect(fundirPorJuicio(context, PROJECT, PROPOSAL, analisis(a, [], [b]))).toBeNull()
    expect(fila((context as unknown as { db: never }).db, b)).toMatchObject({ lifecycle: 'ACTIVE' })
    expect(patches).toEqual([])
  })
})
