import { describe, expect, it } from 'vitest'
import { buildTransitionEvent, type ProposalEvent } from '@domain/repair/proposal-event'
import { createMemoryDb, seedProject } from './memory-db'
import { PROPOSAL_EVENTS_SCHEMA } from './schema-proposal-events'
import { createSqliteProposalEventRepository } from './sqlite-proposal-event-repository'
import type { Db } from './database'

/** La propuesta cuelga de su proyecto (ON DELETE CASCADE): hay que sembrarlo. */
function seedProposal(db: Db, id: string): void {
  seedProject(db, 'p1')
  db.prepare(
    `INSERT INTO repair_proposals (id, project_id, finding_id, base_sha, state, created_at, updated_at)
     VALUES (?, 'p1', 'f1', 'sha', 'ELEGIDO', 1, 1)`
  ).run(id)
}

const evento = (proposalId: string, seq: number, ts: number): ProposalEvent =>
  buildTransitionEvent({ proposalId, seq, phase: 'SELECT', toState: 'ELEGIDO', ts })

describe('createSqliteProposalEventRepository', () => {
  it('asienta y lee la cadena en orden de seq', () => {
    const db = createMemoryDb()
    seedProposal(db, 'r1')
    const repo = createSqliteProposalEventRepository(db)

    repo.append(evento('r1', 1, 100))
    repo.append(evento('r1', 2, 200))

    const cadena = repo.listByProposal('r1')
    expect(cadena.map((e) => e.seq)).toEqual([1, 2])
    expect(cadena[0].actor).toBe('motor')
  })

  it('rechaza seq fuera de orden: el libro no admite huecos', () => {
    const db = createMemoryDb()
    seedProposal(db, 'r1')
    const repo = createSqliteProposalEventRepository(db)

    repo.append(evento('r1', 1, 100))
    expect(() => repo.append(evento('r1', 3, 300))).toThrow(/espera 2/)
    expect(() => repo.append(evento('r1', 1, 300))).toThrow(/espera 2/)
  })

  it('el esquema es idempotente, con datos dentro', () => {
    const db = createMemoryDb()
    seedProposal(db, 'r1')
    createSqliteProposalEventRepository(db).append(evento('r1', 1, 100))

    expect(() => db.exec(PROPOSAL_EVENTS_SCHEMA)).not.toThrow()
    const { n } = db.prepare('SELECT COUNT(*) AS n FROM proposal_events').get() as { n: number }
    expect(n).toBe(1)
  })

  it('ON DELETE CASCADE: borrar la propuesta borra su libro', () => {
    const db = createMemoryDb()
    seedProposal(db, 'r1')
    const repo = createSqliteProposalEventRepository(db)
    repo.append(evento('r1', 1, 100))

    db.prepare('DELETE FROM repair_proposals WHERE id = ?').run('r1')
    expect(repo.listByProposal('r1')).toEqual([])
  })
})
