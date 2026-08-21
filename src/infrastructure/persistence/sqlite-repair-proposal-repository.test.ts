import { describe, expect, it } from 'vitest'
import type { Proposal } from '@domain/repair/proposal'
import { createMemoryDb, seedProject } from './memory-db'
import { createSqliteRepairProposalRepository } from './sqlite-repair-proposal-repository'
import type { Db } from './database'

function propuesta(id: string, findingId: string, createdAt: number, baseSha = 'sha'): Proposal {
  return { id, projectId: 'p1', findingId, baseSha, state: 'ELEGIDO', createdAt, updatedAt: createdAt } // prettier-ignore
}

/** Un hallazgo real en la base, anclado a un escaneo. */
function seedFinding(db: Db, id: string, scanId: string): void {
  db.prepare(
    `INSERT INTO findings (id, project_id, severity, title, file, line, created_at, scan_id)
     VALUES (?, 'p1', 'LOW', 't', 'a.ts', 1, '2026-08-08T10:00:00Z', ?)`
  ).run(id, scanId)
}

describe('createSqliteRepairProposalRepository', () => {
  it('inserta, parchea y lee el expediente (mas reciente primero)', () => {
    const repo = createSqliteRepairProposalRepository(createMemoryDb())
    repo.insert(propuesta('r1', 'f1', 1))
    repo.insert(propuesta('r2', 'f2', 2))
    repo.update('r1', { state: 'ANALIZADO', analysisVerdict: 'REAL', analysisReason: 'ok', updatedAt: 9 }) // prettier-ignore

    expect(repo.findById('r1')).toMatchObject({ state: 'ANALIZADO', analysisVerdict: 'REAL' })
    expect(repo.findById('nope')).toBeNull()
    expect(repo.listByProject('p1').map((p) => p.id)).toEqual(['r1', 'r2'])
  })

  it('findObsoleteFindingIds: solo la propuesta MAS RECIENTE cuenta, y solo sobre su HEAD', () => {
    const db = createMemoryDb()
    seedProject(db, 'p1')
    seedFinding(db, 'f1', 'S1')
    const repo = createSqliteRepairProposalRepository(db)

    repo.insert(propuesta('r1', 'f1', 10, 'head-1'))
    repo.update('r1', { state: 'CADUCADO', analysisVerdict: 'OBSOLETO', analysisReason: 'ya no existe', updatedAt: 11 }) // prettier-ignore

    expect(repo.findObsoleteFindingIds('p1', 'head-1')).toEqual(['f1'])
    // El arbol avanzo: el dictamen se juzgo sobre codigo que ya no es este.
    expect(repo.findObsoleteFindingIds('p1', 'head-2')).toEqual([])

    // Una propuesta POSTERIOR no-obsoleta gana: el hallazgo vuelve a ser elegible.
    repo.insert(propuesta('r2', 'f1', 20, 'head-1'))
    repo.update('r2', { state: 'ANALIZADO', analysisVerdict: 'REAL', analysisReason: 'vive', updatedAt: 21 }) // prettier-ignore
    expect(repo.findObsoleteFindingIds('p1', 'head-1')).toEqual([])
  })
})
