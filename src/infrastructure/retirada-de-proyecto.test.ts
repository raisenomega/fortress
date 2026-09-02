import { beforeEach, describe, expect, it } from 'vitest'
import type { AppContext } from '@application/context'
import { removeProject } from '@application/project/remove-project'
import type { Proposal, ProposalState } from '@domain/repair/proposal'
import type { Db } from './persistence/database'
import { createMemoryDb, seedProject } from './persistence/memory-db'
import { createProposalEventLog } from './persistence/proposal-event-log'
import { createSqliteOmegaLog } from './persistence/sqlite-omega-log'
import { createSqliteProjectRepository } from './persistence/sqlite-project-repository'
import { createSqliteProposalEventRepository } from './persistence/sqlite-proposal-event-repository'
import { createSqliteRepairProposalRepository } from './persistence/sqlite-repair-proposal-repository'

let db: Db
let ctx: AppContext

/**
 * La base es REAL, no un doble, y es TODO el punto: lo afirmado no es que el
 * caso de uso llame a caducar —eso lo probaria un fake— sino que el asiento del
 * juicio SOBREVIVA al DELETE. El parche y el libro de eventos cuelgan de la
 * propuesta y mueren con ella en la cascada; solo `omega_log` no tiene clave
 * foranea. Con un doble, caducar aqui podria ser teatro y nadie se enteraria.
 */
beforeEach(() => {
  db = createMemoryDb()
  seedProject(db, 'p1')
  ctx = {
    projects: createSqliteProjectRepository(db),
    repairProposals: createSqliteRepairProposalRepository(db),
    eventLog: createProposalEventLog(createSqliteProposalEventRepository(db)),
    omegaLog: createSqliteOmegaLog(db)
  } as unknown as AppContext
})

const sembrar = (id: string, state: ProposalState): void =>
  ctx.repairProposals.insert({ id, projectId: 'p1', findingId: `f-${id}`, baseSha: 'sha', state, createdAt: 1, updatedAt: 1 } as Proposal) // prettier-ignore

const cuenta = (tabla: string): number =>
  (db.prepare(`SELECT COUNT(*) AS n FROM ${tabla}`).get() as { n: number }).n

describe('retirar un proyecto: el juicio antes del borrado', () => {
  it('el asiento del juicio SOBREVIVE al borrado del proyecto', async () => {
    sembrar('viva', 'ANALIZADO')

    await removeProject(ctx, 'p1')

    // La fila, sus eventos y el proyecto se fueron con la cascada...
    expect([cuenta('projects'), cuenta('repair_proposals'), cuenta('proposal_events')]).toEqual([0, 0, 0]) // prettier-ignore
    // ...y el Libro conserva el porque, con el proyecto muerto en la fila.
    const asientos = ctx.omegaLog.listByProject('p1', 10)
    expect(asientos).toHaveLength(1)
    expect(asientos[0].summary).toContain('Propuesta viva retirada desde ANALIZADO')
    expect(asientos[0].evidence).toBe('proyecto_retirado')
  })

  it('caduca CADA viva, y no vuelve a juzgar lo que ya murio', async () => {
    sembrar('viva-1', 'ANALIZADO')
    sembrar('viva-2', 'GENERADO')
    sembrar('muerta', 'MERGEADO')

    await removeProject(ctx, 'p1')

    const asientos = ctx.omegaLog.listByProject('p1', 10)
    expect(asientos).toHaveLength(2)
    expect(asientos.every((a) => a.evidence === 'proyecto_retirado')).toBe(true)
    expect(asientos.some((a) => a.summary.includes('muerta'))).toBe(false)
  })

  it('sin propuestas vivas se va sin asiento que inventar', async () => {
    sembrar('muerta', 'CADUCADO')

    expect((await removeProject(ctx, 'p1')).ok).toBe(true)
    expect(ctx.omegaLog.list(10)).toHaveLength(0)
  })
})
