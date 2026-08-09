import { describe, expect, it } from 'vitest'
import { addProjectColumns } from './add-project-columns'
import { createMemoryDb, seedProject } from './memory-db'
import { createSqliteGraphStateRepository } from './sqlite-graph-state-repository'

describe('createSqliteGraphStateRepository', () => {
  it('un proyecto recien creado arranca IDLE y sin indexar', () => {
    const db = createMemoryDb()
    seedProject(db, 'p1')
    const repo = createSqliteGraphStateRepository(db)
    expect(repo.getGraphState('p1')).toEqual({
      indexedSha: null, indexedAt: null, status: 'IDLE', startedAt: null, error: null
    }) // prettier-ignore
  })

  it('running -> success: el ciclo completo queda persistido', () => {
    const db = createMemoryDb()
    seedProject(db, 'p1')
    const repo = createSqliteGraphStateRepository(db)

    repo.markRunning('p1', 111)
    expect(repo.getGraphState('p1')).toMatchObject({ status: 'RUNNING', startedAt: 111 })

    repo.markSuccess('p1', 'sha-x', 222)
    expect(repo.getGraphState('p1')).toEqual({
      indexedSha: 'sha-x', indexedAt: 222, status: 'IDLE', startedAt: null, error: null
    }) // prettier-ignore
  })

  it('running -> error: conserva el ultimo SHA bueno y el motivo del fallo', () => {
    const db = createMemoryDb()
    seedProject(db, 'p1')
    const repo = createSqliteGraphStateRepository(db)

    repo.markSuccess('p1', 'sha-bueno', 100)
    repo.markRunning('p1', 200)
    repo.markError('p1', 'se rompio', 300)

    expect(repo.getGraphState('p1')).toMatchObject({
      status: 'ERROR', error: 'se rompio', indexedSha: 'sha-bueno', startedAt: null
    }) // prettier-ignore
    // markRunning limpia el error anterior: un reintento arranca limpio.
    repo.markRunning('p1', 400)
    expect(repo.getGraphState('p1')).toMatchObject({ status: 'RUNNING', error: null })
  })

  it('la migracion aditiva es idempotente: aplicarla dos veces no rompe', () => {
    const db = createMemoryDb() // ya corrio addProjectColumns via runMigrations
    expect(() => addProjectColumns(db)).not.toThrow()
    seedProject(db, 'p1')
    expect(createSqliteGraphStateRepository(db).getGraphState('p1').status).toBe('IDLE')
  })
})
