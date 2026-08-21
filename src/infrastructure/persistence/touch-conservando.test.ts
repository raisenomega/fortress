import { describe, expect, it } from 'vitest'
import { createMemoryDb, seedProject } from './memory-db'
import { createSqliteFindingRepository } from './sqlite-finding-repository'
import type { Db } from './database'

const HOY = '2026-08-21T10:00:00Z'
const DETECTADO = { severity: 'HIGH' as const, title: 'el gate no exige confianza', file: 'a.ts', line: 19 } // prettier-ignore

function banco(): { db: Db; repo: ReturnType<typeof createSqliteFindingRepository> } {
  const db = createMemoryDb()
  seedProject(db, 'p1')
  const repo = createSqliteFindingRepository(db)
  repo.syncFromScan('p1', 's1', [DETECTADO], '2026-08-20T10:00:00Z')
  return { db, repo }
}

const idDe = (repo: ReturnType<typeof createSqliteFindingRepository>): string =>
  repo.listByProject('p1')[0]?.id ?? ''
const estado = (repo: ReturnType<typeof createSqliteFindingRepository>): string =>
  repo.listByProject('p1')[0]?.lifecycle ?? ''

describe('el escaneo que vuelve a ver un mitigado', () => {
  it('conservandolo: sigue MITIGATED y aun asi se refresca la linea', () => {
    const { repo } = banco()
    const id = idDe(repo)
    repo.markMitigated(id, 'arreglado al lado', HOY)

    repo.syncFromScan('p1', 's2', [{ ...DETECTADO, line: 41 }], HOY, new Set([id]))

    expect(estado(repo)).toBe('MITIGATED')
    expect(repo.listByProject('p1')[0]?.line).toBe(41)
  })

  it('sin conservarlo: vuelve a ACTIVE, como siempre', () => {
    const { repo } = banco()
    repo.markMitigated(idDe(repo), 'arreglado al lado', HOY)

    repo.syncFromScan('p1', 's2', [DETECTADO], HOY)

    expect(estado(repo)).toBe('ACTIVE')
  })

  it('no-regresion: un ACTIVE re-visto sigue ACTIVE', () => {
    const { repo } = banco()
    repo.syncFromScan('p1', 's2', [DETECTADO], HOY)
    expect(estado(repo)).toBe('ACTIVE')
  })

  it('el operador deshace su marca y el hallazgo vuelve a la cola', () => {
    const { repo } = banco()
    const id = idDe(repo)
    repo.markMitigated(id, 'me equivoque', HOY)

    expect(repo.markActive(id)).toBe(true)
    expect(estado(repo)).toBe('ACTIVE')
    expect(repo.listByProject('p1')[0]?.mitigatedNote).toBeNull()
  })

  it('deshacer lo que no estaba mitigado no hace nada', () => {
    const { repo } = banco()
    expect(repo.markActive(idDe(repo))).toBe(false)
  })
})
