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

describe('findObsoleteFindingIds — el ancla es el arbol, no el escaneo', () => {
  it('el descuento NO depende del escaneo: un hallazgo de un escaneo viejo tambien pausa', () => {
    const db = createMemoryDb()
    seedProject(db, 'p1')
    // El hallazgo quedo anclado a un escaneo antiguo y nunca se volvio a nombrar.
    // Antes eso lo hacia inmune al descuento y volvia a la cola cada ciclo.
    seedFinding(db, 'f1', 'ESCANEO-VIEJO')
    const repo = createSqliteRepairProposalRepository(db)

    repo.insert(propuesta('r1', 'f1', 10, 'head-actual'))
    repo.update('r1', { state: 'CADUCADO', analysisVerdict: 'OBSOLETO', analysisReason: 'reparado', updatedAt: 11 }) // prettier-ignore

    expect(repo.findObsoleteFindingIds('p1', 'head-actual')).toEqual(['f1'])
  })

  it('un analisis ILEGIBLE no descuenta: el hallazgo sigue en la cola', () => {
    // El descuento silencia al hallazgo, y solo debe hacerlo cuando el analista
    // dijo de verdad que ya no existe. Si no se pudo leer su respuesta, nadie
    // llego a saberlo: sacarlo de la cola lo daria por resuelto sin resolverlo.
    const db = createMemoryDb()
    seedProject(db, 'p1')
    seedFinding(db, 'f1', 'S1')
    const repo = createSqliteRepairProposalRepository(db)

    repo.insert(propuesta('r1', 'f1', 10, 'head-actual'))
    repo.update('r1', { state: 'RECHAZADO', analysisVerdict: 'ILEGIBLE', analysisReason: 'analisis_ilegible: ]', updatedAt: 11 }) // prettier-ignore

    expect(repo.findObsoleteFindingIds('p1', 'head-actual')).toEqual([])
  })

  it('sin propuesta obsoleta no se descuenta nada', () => {
    const db = createMemoryDb()
    seedProject(db, 'p1')
    seedFinding(db, 'f1', 'S1')
    const repo = createSqliteRepairProposalRepository(db)

    repo.insert(propuesta('r1', 'f1', 10, 'head-1'))
    expect(repo.findObsoleteFindingIds('p1', 'head-1')).toEqual([])
  })
})
