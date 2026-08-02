import type { NewProject, Project } from '@domain/project/project'
import type { ProjectRepository } from '@domain/project/project-repository'
import { newId, nowIso } from '@domain/shared/id'
import type { Db } from './database'
import { toProject, type ProjectRow } from './project-row'

const COLUMNS = `id, name, path, stack, git_remote, git_branch, fortress_score,
  last_scan, has_claude, has_graph, has_fortress, created_at`

/** Todas las consultas van parametrizadas: nunca se concatena input. */
export function createSqliteProjectRepository(db: Db): ProjectRepository {
  const selectAll = db.prepare(`SELECT ${COLUMNS} FROM projects ORDER BY created_at ASC`)
  const selectById = db.prepare(`SELECT ${COLUMNS} FROM projects WHERE id = ?`)
  const selectByPath = db.prepare(`SELECT ${COLUMNS} FROM projects WHERE path = ?`)
  const deleteById = db.prepare('DELETE FROM projects WHERE id = ?')
  const insert = db.prepare(
    `INSERT INTO projects (id, name, path, stack, git_remote, git_branch, has_claude, created_at)
     VALUES (@id, @name, @path, @stack, @gitRemote, @gitBranch, @hasClaude, @createdAt)`
  )

  return {
    list: () => (selectAll.all() as ProjectRow[]).map(toProject),

    findById: (id) => {
      const row = selectById.get(id) as ProjectRow | undefined
      return row ? toProject(row) : null
    },

    findByPath: (path) => {
      const row = selectByPath.get(path) as ProjectRow | undefined
      return row ? toProject(row) : null
    },

    add: (project: NewProject): Project => {
      const id = newId()
      insert.run({
        id,
        name: project.name,
        path: project.path,
        stack: project.stack,
        gitRemote: project.gitRemote,
        gitBranch: project.gitBranch,
        hasClaude: project.hasClaude ? 1 : 0,
        createdAt: nowIso()
      })
      return toProject(selectById.get(id) as ProjectRow)
    },

    remove: (id) => {
      deleteById.run(id)
    }
  }
}
