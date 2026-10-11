import { describe, expect, it } from 'vitest'
import { createMemoryDb, seedProject } from './memory-db'
import { createSqliteProjectRepository } from './sqlite-project-repository'

/** PASO 165: `setGitRemote` persiste de verdad el nuevo remoto en la columna
 *  `git_remote` (la caché que set-remote sincroniza con `.git/config`). */
const NUEVO = 'https://github.com/raisenomega/health.git'

describe('sqlite setGitRemote persiste la caché', () => {
  it('actualiza projects.git_remote y findById lo refleja', () => {
    const db = createMemoryDb()
    const id = seedProject(db, 'p1')
    const repo = createSqliteProjectRepository(db)

    repo.setGitRemote(id, NUEVO)

    expect(repo.findById(id)?.gitRemote).toBe(NUEVO)
    const crudo = db.prepare('SELECT git_remote FROM projects WHERE id = ?').get(id) as {
      git_remote: string | null
    }
    expect(crudo.git_remote).toBe(NUEVO)
  })
})
