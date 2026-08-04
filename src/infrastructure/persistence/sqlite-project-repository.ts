import { normalizeScore } from '@domain/project/fortress-score'
import type { NewProject, Project } from '@domain/project/project'
import type { ProjectRepository } from '@domain/project/project-repository'
import { newId, nowIso } from '@domain/shared/id'
import type { Db } from './database'
import { toProject, type ProjectRow } from './project-row'

const COLUMNS = `id, name, path, stack, git_remote, git_branch, fortress_score,
  last_scan, has_claude, has_graph, has_fortress, trusted, loop_enabled, created_at`

/** Parametros del INSERT. trusted no va: nace en 0 (no confiable) por defecto. */
function toInsertParams(project: NewProject): Record<string, string | number | null> {
  return {
    id: newId(),
    name: project.name,
    path: project.path,
    stack: project.stack,
    gitRemote: project.gitRemote,
    gitBranch: project.gitBranch,
    hasClaude: project.hasClaude ? 1 : 0,
    createdAt: nowIso()
  }
}

/** Todas las consultas van parametrizadas: nunca se concatena input. */
export function createSqliteProjectRepository(db: Db): ProjectRepository {
  const selectAll = db.prepare(`SELECT ${COLUMNS} FROM projects ORDER BY created_at ASC`)
  const selectById = db.prepare(`SELECT ${COLUMNS} FROM projects WHERE id = ?`)
  const selectByPath = db.prepare(`SELECT ${COLUMNS} FROM projects WHERE path = ?`)
  const deleteById = db.prepare('DELETE FROM projects WHERE id = ?')
  const updateScan = db.prepare(
    'UPDATE projects SET fortress_score = ?, last_scan = ? WHERE id = ?'
  )
  const updateTrusted = db.prepare('UPDATE projects SET trusted = ? WHERE id = ?')
  const updateLoop = db.prepare('UPDATE projects SET loop_enabled = ? WHERE id = ?')
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
      insert.run(toInsertParams(project))
      return toProject(selectByPath.get(project.path) as ProjectRow)
    },
    remove: (id) => deleteById.run(id),
    updateScan: (id, score, scannedAt) => updateScan.run(normalizeScore(score), scannedAt, id),
    setTrusted: (id, trusted) => updateTrusted.run(trusted ? 1 : 0, id),
    setLoopEnabled: (id, enabled) => updateLoop.run(enabled ? 1 : 0, id)
  }
}
